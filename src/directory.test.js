import test from 'node:test';
import assert from 'node:assert/strict';
import {filterDirectory,validateDirectory,sanitizeShelf,shareIds,parseSharedIds,paginateDirectory,normalizeRating,LIST_STATUSES,validCoverArt} from './directory.js';
const series=[
 {id:'a',title:'A Cultivation Tale',author:'Alpha',originalLanguage:'Chinese',sourceUrl:'https://www.novelupdates.com/series/alpha/',kind:'external-index',genres:['Cultivation','Progression'],aliases:['Old Name'],summary:'An immortal academy',workStatus:'Completed'},
 {id:'b',title:'Loop Academy',author:'Beta',originalLanguage:'English',sourceUrl:'https://www.royalroad.com/fiction/123/example',kind:'external-index',genres:['Time Loop','Academy'],aliases:[],summary:'A magical academy loop',workStatus:'Ongoing'}
];
test('verified external metadata is accepted without hosted chapters',()=>{
 assert.equal(validateDirectory({schema:'novalume.external-series.v1',series}).length,2);
});
test('directory queries search aliases, authors and genres',()=>{
 assert.deepEqual(filterDirectory(series,{q:'old name'}).map(x=>x.id),['a']);
 assert.deepEqual(filterDirectory(series,{q:'beta loop'}).map(x=>x.id),['b']);
 assert.deepEqual(filterDirectory(series,{q:'academy',language:'Chinese'}).map(x=>x.id),['a']);
});
test('include AND exclude tags and languages are precise',()=>{
 assert.deepEqual(filterDirectory(series,{include:['Cultivation'],exclude:['Time Loop']}).map(x=>x.id),['a']);
 assert.deepEqual(filterDirectory(series,{language:'Korean'}),[]);
 assert.deepEqual(filterDirectory(series,{status:'Completed'}).map(x=>x.id),['a']);
});
test('malicious URL and duplicate ids are rejected',()=>{
 assert.throws(()=>validateDirectory({schema:'novalume.external-series.v1',series:[{...series[0],sourceUrl:'javascript:alert(1)'}]}));
 assert.throws(()=>validateDirectory({schema:'novalume.external-series.v1',series:[series[0],series[0]]}));
});
test('shelf import cannot plant unknown or dangerous IDs',()=>{
 const raw=JSON.parse('{"a":{"status":"Reading","chapter":85,"note":"Good"},"unknown":{"status":"Reading","chapter":1},"__proto__":{"status":"Completed","chapter":9},"b":{"status":"invalid","chapter":4}}');
 const clean=sanitizeShelf(raw,series);
 assert.deepEqual(Object.keys(clean),['a']);
 assert.deepEqual(clean.a,{status:'Reading',chapter:85,note:'Good',rating:0,review:'',reviewSpoiler:false});
 assert.equal(Object.getPrototypeOf(clean),null);
});
test('invalid chapter progress is safely clamped',()=>{
 const clean=sanitizeShelf({a:{status:'Reading',chapter:-15,note:'x'.repeat(700)}},series);
 assert.equal(clean.a.chapter,0);
 assert.equal(clean.a.note.length,500);
 assert.equal(LIST_STATUSES.length,5);
});

test('shareable lists expose only real series IDs, not private notes or progress',()=>{
 const shelf={a:{status:'Reading',chapter:123,note:'private'},b:{status:'Completed',chapter:9,note:'spoiler'}};
 const link=shareIds(shelf,series).join(',');
 assert.equal(link,'a,b');
 assert.ok(!link.includes('spoiler'));assert.ok(!link.includes('123'));
 assert.deepEqual(parseSharedIds(link,series),['a','b']);
 assert.deepEqual(parseSharedIds('a,unknown,a,__proto__',series),['a']);
 assert.deepEqual(parseSharedIds('x'.repeat(1001),series),[]);
});

test('directory pagination handles thousands without rendering every card',()=>{
 const books=Array.from({length:3200},(_,i)=>({id:'book-'+i,title:'Book '+i}));
 const p1=paginateDirectory(books,1),p2=paginateDirectory(books,2),last=paginateDirectory(books,1000000);
 assert.equal(p1.total,3200);
 assert.equal(p1.items.length,24);
 assert.equal(p1.to,24);
 assert.equal(p2.from,25);
 assert.equal(p2.items.length,24);
 assert.equal(last.page,last.pages);
 assert.equal(last.items.at(-1).id,'book-3199');
 assert.equal(paginateDirectory([],1).items.length,0);
});

test('local half stars and private reviews are valid but public lists omit them',()=>{
 const shelf=sanitizeShelf({a:{status:'Completed',chapter:250,rating:4.5,review:'Private twist',reviewSpoiler:true}},series);
 assert.equal(shelf.a.rating,4.5);assert.equal(shelf.a.review,'Private twist');assert.equal(shelf.a.reviewSpoiler,true);
 assert.equal(shareIds(shelf,series).join(','),'a');
 assert.equal(normalizeRating(4.25),0);assert.equal(normalizeRating(3.5),3.5);assert.equal(normalizeRating(-1),0);
});

test('reviewed Open Library edition cover is narrowly validated',()=>{
 const art={provider:'openlibrary',editionId:'OL31573848M',editionUrl:'https://openlibrary.org/books/OL31573848M/Mother_of_Learning',mode:'remote-display',sourceCheckedAt:'2026-11-08'};
 assert.equal(validCoverArt(art),true);
 assert.equal(validateDirectory({schema:'novalume.external-series.v1',series:[{...series[0],coverArt:art}]}).length,1);
 for(const a of [{...art,editionId:'OL31573848M/evil'},{...art,editionUrl:'https://openlibrary.org.evil.com/books/OL31573848M/Mother_of_Learning'},{...art,mode:'rehost'},{...art,editionUrl:art.editionUrl+'?evil=1'}]){
  assert.equal(validCoverArt(a),false);
  assert.throws(()=>validateDirectory({schema:'novalume.external-series.v1',series:[{...series[0],coverArt:a}]}));
 }
});
