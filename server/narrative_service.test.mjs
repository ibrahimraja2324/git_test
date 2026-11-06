import test from 'node:test';
import assert from 'node:assert/strict';
import {requestArgs,searchEventIndex} from './narrative_service.mjs';
const index={schema:'novalume.private-narrative-events.v1',books:{book:{title:'An Approved Novel',chapterCount:5}},
 events:[
 {id:'a',bookId:'book',chapter:1,paragraph:2,chapterTitle:'Chapter 1',status:'editorial-sample',
  summary:'Mother asks father about wealthy newcomer.',
  relation:{type:'family-information',actor:'Mother',predicate:'asks',object:'wealthy newcomer'},
  topics:['family','wealth','conversation']},
 {id:'b',bookId:'book',chapter:5,paragraph:3,chapterTitle:'Chapter 5',status:'editorial-sample',
  summary:'The protagonist discovers an ability and shocks the gathering.',
  relation:{type:'public-reaction',actor:'protagonist',predicate:'discovers',object:'ability'},
  topics:['hidden ability','power reveal','shock','audience reaction']}
]};
test('default returns no event detail, chapter or future facts',()=>{
 const out=searchEventIndex(requestArgs({query:'power reveal'}),index);
 assert.equal(out.results.length,1);
 assert.equal(out.results[0].detailsHidden,true);
 assert.equal(out.results[0].events,undefined);
 assert.ok(!JSON.stringify(out).includes('protagonist discovers'));
});
test('explicit detail requires named book and bounded chapter cutoff',()=>{
 assert.throws(()=>requestArgs({query:'power reveal',reveal:'1'}));
 assert.throws(()=>requestArgs({query:'power reveal',reveal:'1',bookId:'book',chapterLimit:'0'}));
 assert.throws(()=>requestArgs({query:'power reveal',reveal:'1',bookId:'book',chapterLimit:'100000'}));
});
test('future events never appear past reader chapter cutoff',()=>{
 const out=searchEventIndex(requestArgs({query:'shock ability',reveal:'1',bookId:'book',chapterLimit:'1'}),index);
 assert.equal(out.results.length,1);
 assert.deepEqual(out.results[0].events,[]);
 assert.ok(!JSON.stringify(out).includes('protagonist discovers'));
});
test('after explicit reveal, only permitted chapter and short editorial claim is returned',()=>{
 const out=searchEventIndex(requestArgs({query:'shock ability',reveal:'1',bookId:'book',chapterLimit:'5'}),index);
 assert.equal(out.results[0].events[0].chapter,5);
 assert.equal(out.results[0].events[0].verification,'source-anchored-editorial-sample');
 assert.ok(!('sourceAnchor' in out.results[0].events[0]));
 assert.ok(!('paragraphSha256' in out.results[0].events[0]));
});
test('unmatched plots are not claimed',()=>{
 assert.deepEqual(searchEventIndex(requestArgs({query:'underestimated cultivation elders'}),index).results,[]);
});
