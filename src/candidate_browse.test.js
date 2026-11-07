import test from 'node:test';
import assert from 'node:assert/strict';
import {queryLeads,sliceLeads} from './candidate_browse.js';
const fixture=[{title:'魔法学徒',author:'甲',categoryHint:'Fantasy'},{title:'神龙',author:'乙',categoryHint:'Cultivation'}];
test('candidate title search and pagination work independently of canon',()=>{
 assert.equal(queryLeads(fixture,{q:'魔法'}).length,1);
 assert.equal(queryLeads(fixture,{q:'乙',category:'Fantasy'}).length,0);
 assert.equal(sliceLeads(Array.from({length:4094},(_,i)=>({i})),2).items.length,24);
});
