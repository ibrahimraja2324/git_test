import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePremises,matchPremises,deriveWants} from './premise_lens.js';
const books=[
 {id:'a',title:'A',summary:'A young mage studies and grows slowly with training.',genres:['Magic']},
 {id:'b',title:'B',summary:'A hero builds a community through engineering.',genres:['Fantasy']},
 {id:'c',title:'C',summary:'A famous leader inspires a new generation.',genres:['Magic']}
];
const source={schema:'novalume.editorial-premise-hints.v1',claims:[
 {workId:'a',dimension:'earned_power',summaryPhrase:'studies and grows slowly with training',class:'editorial-premise',field:'summary'},
 {workId:'b',dimension:'world_consequence',summaryPhrase:'builds a community through engineering',class:'editorial-premise',field:'summary'}
]};
test('only exact editorial source phrases qualify',()=>{
 assert.equal(validatePremises(source,books).length,2);
 assert.throws(()=>validatePremises({...source,claims:[{...source.claims[0],summaryPhrase:'A verified chapter proves a battle'}]},books));
 assert.throws(()=>validatePremises({...source,claims:[...source.claims,source.claims[0]]},books));
});
test('rank matching source-backed premises, never assume genre predicts a trait',()=>{
 const found=matchPremises(books,source.claims,['earned_power']);
 assert.deepEqual(found.map(x=>x.series.id),['a']);
 assert.equal(matchPremises(books,source.claims,['public_recognition']).length,0);
 assert.deepEqual(matchPremises(books,source.claims,['earned_power'],{shelf:{a:{status:'Completed'}}}),[]);
 assert.deepEqual(matchPremises(books,source.claims,['fake_feature']),[]);
});
test('reader-stated wants can seed local brief but cannot create new story facts',()=>{
 const ledger={a:{wanted:['earned_power','earned_power'],delivered:['earned_power']},
 b:{wanted:['world_consequence'],missing:['world_consequence']}};
 assert.deepEqual(deriveWants(books,ledger),['earned_power','world_consequence']);
});
