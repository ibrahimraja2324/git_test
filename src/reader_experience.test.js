import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanExperience,cleanLedger,experienceStats,experienceCloudRows,decodeCloudRows,EXPECTATIONS} from './reader_experience.js';
const books=[{id:'a',title:'Known source work'},{id:'b',title:'Other verified work'}];
test('capturing expectations and outcomes is not a claim that the story objectively contains a trait',()=>{
 const x=cleanExperience({wanted:['public_recognition','measurable_growth','nope'],delivered:['public_recognition'],
  missing:['measurable_growth','nope'],outcome:'stopped',chapter:40,note:'Too much setup'});
 assert.deepEqual(x.wanted,['public_recognition','measurable_growth']);
 assert.deepEqual(x.delivered,['public_recognition']);
 assert.deepEqual(x.missing,['measurable_growth']);
 assert.equal(x.chapter,40);
 assert.equal(x.outcome,'stopped');
});
test('reject unsupported story keys, duplicate feedback codes, invalid statuses, and long notes',()=>{
 const x=cleanLedger({'a':{wanted:['fast_pacing','fast_pacing','private_password'],delivered:['fast_pacing'],
  missing:['fast_pacing'],outcome:'impossible',note:'a'.repeat(999)},'not-verified':{wanted:['fast_pacing']}},books);
 assert.deepEqual(Object.keys(x),['a']);
 assert.deepEqual(x.a.delivered,[]);
 assert.deepEqual(x.a.missing,['fast_pacing']);
 assert.equal(x.a.note.length,280);
 assert.equal(x.a.outcome,'unspecified');
});
test('personal counts distinguish wanted, delivered and failed without inventing book metadata',()=>{
 const ledger={a:{wanted:['public_recognition'],delivered:['public_recognition'],outcome:'completed'},
 b:{wanted:['public_recognition'],missing:['public_recognition'],outcome:'stopped'}};
 const x=experienceStats(books,ledger);
 assert.equal(x.recordCount,2);
 const trait=x.dimensions.find(x=>x.id==='public_recognition');
 assert.deepEqual([trait.wanted,trait.delivered,trait.missing],[2,1,1]);
});
test('cloud payload uses verified works only, limits note and contains no public identifiers or scraped texts',()=>{
 const id='00000000-0000-4000-8000-000000000001';
 const row=experienceCloudRows(books,{a:{wanted:['public_recognition'],note:'my private impression'},fake:{wanted:['fast_pacing']}},id);
 assert.equal(row.length,1);
 assert.equal(row[0].work_id,'a');
 assert.ok(!('is_verified_story_fact' in row[0]));
 assert.equal(decodeCloudRows([{work_id:'a',wanted:['public_recognition'],private_note:'hi'}],books).a.note,'hi');
 assert.equal(EXPECTATIONS.length,10);
});

import {contributionRows} from './reader_experience.js';
test('opt-in payload is codes only, excludes private notes, exact chapters and unjudged entries',()=>{
 const user='00000000-0000-4000-8000-000000000001';
 const ledger={a:{wanted:['public_recognition','earned_power'],delivered:['earned_power'],
  missing:['public_recognition'],note:'Highly personal diary note',chapter:165,outcome:'stopped'},
 b:{wanted:['earned_power'],note:'I have not decided yet',chapter:20},
 fake:{wanted:['earned_power'],delivered:['earned_power']}};
 const rows=contributionRows(books,ledger,user,'2026-11-08T00:00:00Z');
 assert.equal(rows.length,1);
 assert.deepEqual(rows[0].wanted,['public_recognition','earned_power']);
 assert.deepEqual(rows[0].missing,['public_recognition']);
 assert.equal(rows[0].chapter_band,'100-499');
 assert.equal(rows[0].consent_version,'novalume-research-v1-2026-11');
 assert.ok(!('note' in rows[0])&&!('private_note' in rows[0])&&!('chapter' in rows[0]));
 assert.ok(!JSON.stringify(rows).includes('Highly personal'));
});
test('unwanted outcomes are not donated, invalid identity receives no payload',()=>{
 const user='00000000-0000-4000-8000-000000000001';
 const l={a:{wanted:['earned_power'],delivered:['fast_pacing'],note:'secret'}};
 assert.deepEqual(contributionRows(books,l,user),[]);
 assert.deepEqual(contributionRows(books,l,'not-an-account'),[]);
});
