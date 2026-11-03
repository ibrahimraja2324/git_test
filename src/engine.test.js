import test from 'node:test';import assert from 'node:assert/strict';
import {parseIntent,rankBooks,scoreBook} from './engine.js';
const fixture=[{id:'1',title:'A Secret',author:'A',genre:'Fantasy',tags:['hidden identity','revenge'],storySignals:['public reaction'],blurb:'Hidden power',featured:3,status:'ready'},{id:'2',title:'Mystery at Sea',author:'B',genre:'Mystery',tags:['mystery'],storySignals:[],blurb:'Detectives',featured:4,status:'external'}];
test('matches compound narrative intent',()=>{const p=parseIntent('secret identity and everyone shocked');assert(p.wanted.includes('hidden identity'));assert(p.wanted.includes('public reaction'))});
test('high signal matches rank above unrelated books',()=>assert.equal(rankBooks(fixture,'hidden identity')[0].id,'1'));
test('filter respects genre',()=>assert.deepEqual(rankBooks(fixture,'',[],'Mystery').map(x=>x.id),['2']));
test('empty search uses featured curation',()=>assert.equal(rankBooks(fixture)[0].id,'2'));
