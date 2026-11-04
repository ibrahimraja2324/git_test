import test from 'node:test';import assert from 'node:assert/strict';
import {searchBooks,safeQuery} from './search_service.mjs';
const catalog=[{id:'x',title:'Castle',author:'Anon',genre:'Gothic',blurb:'A public story',chapterCount:3,sourceUrl:'https://example.org',status:'ready'},
  {id:'locked',title:'Locked',status:'external',chapterCount:4}];
const idx={schema:'novalume.dynamic-text-evidence.v2',paragraphCount:80,dynamicPhrases:[{phrase:'secret silver compass',paragraphFrequency:3,evidence:[{excerpt:'SPOILER: villain is grandmother'}]},{phrase:'courtyard',paragraphFrequency:5}],candidateEntities:[{text:'Lady Rosalind',paragraphFrequency:3}],coMentions:[{left:'X',right:'Y'}]};
test('natural open-vocabulary terms match from private text but never leak the details',()=>{
 const res=searchBooks({query:'secret silver compass courtyard'},catalog,{x:idx,locked:idx});
 assert.equal(res.length,1);assert.equal(res[0].title,'Castle');
 assert(!JSON.stringify(res).includes('silver compass'));assert(!JSON.stringify(res).includes('villain'));
 assert(!JSON.stringify(res).includes('Rosalind'));assert(!JSON.stringify(res).includes('coMentions'));
});
test('rights gated unhosted books not returned',()=>assert.equal(searchBooks({query:'silver'},[catalog[1]],{locked:idx}).length,0));
test('empty and malformed searches rejected',()=>{assert.throws(()=>safeQuery({q:''}));assert.equal(safeQuery({query:'x'.repeat(700)}).query.length,500)});
test('queries with no observed text match return no results',()=>assert.deepEqual(searchBooks({query:'dragons'},catalog,{x:idx}),[]));

test('strict multi-clause searches require all distinct user-described content terms',()=>{
 const yes=searchBooks({query:'compass',requiredConcepts:['secret silver','courtyard']},catalog,{x:idx});
 assert.equal(yes.length,1);
 const no=searchBooks({query:'compass',requiredConcepts:['secret silver','cultivation realm']},catalog,{x:idx});
 assert.equal(no.length,0);
});
test('negative natural-language clause removed from positive search intent',()=>{
 const x=safeQuery({query:'secret silver compass, avoid romance filler'});
 assert(x.avoid.some(y=>y.includes('romance filler')));
 assert(!x.positiveQuery.includes('romance filler'));
});
