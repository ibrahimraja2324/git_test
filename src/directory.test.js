import test from 'node:test';
import assert from 'node:assert/strict';
import {filterDirectory,validateDirectory,sanitizeShelf,LIST_STATUSES} from './directory.js';
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
 assert.deepEqual(clean.a,{status:'Reading',chapter:85,note:'Good'});
 assert.equal(Object.getPrototypeOf(clean),null);
});
test('invalid chapter progress is safely clamped',()=>{
 const clean=sanitizeShelf({a:{status:'Reading',chapter:-15,note:'x'.repeat(700)}},series);
 assert.equal(clean.a.chapter,0);
 assert.equal(clean.a.note.length,500);
 assert.equal(LIST_STATUSES.length,5);
});
