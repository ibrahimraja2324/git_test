import test from 'node:test';
import assert from 'node:assert/strict';
import {requestStaticArgs,searchStaticEvidence} from './static_observation_service.mjs';
const term={id:'x',bookId:'classic',chapter:9,paragraph:3,offset:0,evidencePreview:'The crowd was shocked when Victor revealed a new power.',
 terms:['crowd','shocked','victor','revealed','new','power'],predicateCandidates:['revealed'],
 entityMentions:['Victor'],rankingHints:['public-reaction','progression'],
 uncertainty:{negationPresent:false,hypotheticalLanguage:false}};
const index={classic:{schema:'novalume.private-static-observations.v1',
 bookId:'classic',title:'Example Approved Classic',chapterCount:12,
 observations:[term]}};
test('default does not include chapters, previews, clues or hidden characters',()=>{
 const ret=searchStaticEvidence({query:'shock power'},index);
 assert.equal(ret.results.length,1);
 assert.equal(ret.results[0].detailsHidden,true);
 assert.ok(!JSON.stringify(ret).includes('Victor'));
 assert.ok(!JSON.stringify(ret).includes('Chapter 9'));
});
test('explicit reveal is gated by book and chapter boundary',()=>{
 assert.throws(()=>requestStaticArgs({query:'shock power',reveal:'1'}));
 assert.throws(()=>requestStaticArgs({query:'shock power',reveal:'1',bookId:'classic',chapterLimit:'0'}));
 const out=searchStaticEvidence({query:'shock power',reveal:'1',bookId:'classic',chapterLimit:'8'},index);
 assert.deepEqual(out.results[0].observations,[]);
 assert.ok(!JSON.stringify(out).includes('Victor'));
});
test('requested cutoff shows short unverified evidence, not full chapter text',()=>{
 const out=searchStaticEvidence({query:'shock power',reveal:'true',bookId:'classic',chapterLimit:'9'},index);
 assert.equal(out.results[0].observations.length,1);
 assert.equal(out.results[0].observations[0].chapter,9);
 assert.equal(out.results[0].observations[0].observationType,'unreviewed textual clue');
 assert.ok(!('sourceText' in out.results[0].observations[0]));
});
test('nonmatching query not falsely promoted to meaningful relationship',()=>{
 assert.deepEqual(searchStaticEvidence({query:'necromantic apprenticeship'},index).results,[]);
});
test('bad identifiers never turn into filesystem paths',()=>{
 assert.throws(()=>requestStaticArgs({query:'potion ranks',bookId:'../../secret',reveal:'1',chapterLimit:'2'}));
});
