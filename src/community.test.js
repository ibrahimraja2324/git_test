import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudDiaryRows,reviewCard,prepareNovelSuggestion} from './community.js';
const series=[
 {id:'lord-of-the-mysteries',title:'Lord of the Mysteries'},
 {id:'another-work',title:'Another Work'}
];
test('cloud backup keeps only verified canonical work IDs and valid private status',()=>{
 const userid='00000000-0000-4000-8000-000000000001';
 const shelf={
  'lord-of-the-mysteries':{status:'Reading',chapter:222,rating:4.5,note:'secret notes',review:'Private twist',reviewSpoiler:true},
  'missing-work':{status:'Completed',chapter:10,rating:5,note:'Unknown'},
  'another-work':{status:'Impossible',chapter:100,rating:5}
 };
 const saved=cloudDiaryRows(shelf,series,userid);
 assert.equal(saved.length,1);
 assert.equal(saved[0].work_id,'lord-of-the-mysteries');
 assert.equal(saved[0].review_spoiler,true);
 assert.equal(saved[0].rating,4.5);
 assert.equal(saved[0].chapter,222);
 assert.equal(saved[0].note,'secret notes');
});
test('refuse to send private diary without user identity',()=>{
 assert.deepEqual(cloudDiaryRows({'lord-of-the-mysteries':{status:'Reading',chapter:4}},series,'invalid'),[]);
});
test('social reviews escape author HTML and never show spoiler text by default',()=>{
 const item={id:'123e4567-e89b-42d3-a456-426614174000',user_id:'other',
  work_id:'lord-of-the-mysteries',body:'<img src=x onerror=alert(1)> secret',
  rating:4.5,spoiler:true,created_at:'2026-11-07T00:00:00Z'};
 const html=reviewCard(item,'reader','A & B',null);
 assert.ok(!html.includes('<img'));
 assert.ok(html.includes('&lt;img'));
 assert.ok(html.includes('<details'));
 assert.ok(html.includes('Contains spoilers'));
 assert.ok(html.includes('A &amp; B'));
 assert.ok(!html.includes('data-review-report'));
});
test('report action appears only when signed in and review is not your own',()=>{
 const item={id:'123e4567-e89b-42d3-a456-426614174000',user_id:'author',work_id:'another-work',
  body:'I love this story. It progresses well.',spoiler:false,rating:4,created_at:'2026-11-07'};
 assert.ok(reviewCard(item,'author','Novel','reader').includes('data-review-report'));
 assert.ok(!reviewCard(item,'author','Novel','author').includes('data-review-report'));
});

test('real publisher page can be submitted only as a private review candidate',()=>{
 const s=prepareNovelSuggestion({title:'玄幻：开局一座天机阁',author:'三尺青锋',
  original_language:'Chinese',source_url:'https://fanqienovel.com/page/6990230896360033293',
  notes:'Source title and author confirmed'},[]);
 assert.equal(s.source_url,'https://fanqienovel.com/page/6990230896360033293');
 assert.equal(s.title,'玄幻：开局一座天机阁');
 assert.ok(!('review_status' in s));
 assert.ok(!('approved' in s));
});
test('never accept keyword pages, fake domains or URLs with credentials',()=>{
 const base={title:'Real Original',author:'Writer',original_language:'Chinese'};
 for(const source_url of [
  'https://fanqienovel.com/keyword/7323056885827995686',
  'https://fanqienovel.com/reader/6990230896360033293',
  'https://fanqienovel.com.evil.com/page/6990230896360033293',
  'https://example.com/series/x',
  'https://user:pass@www.tadu.com/book/802975',
  'javascript:alert(1)',
  'https://www.tadu.com/book/802975?redirect=site',
 ]){
  assert.throws(()=>prepareNovelSuggestion({...base,source_url},[]));
 }
});
test('do not solicit already indexed source URLs',()=>{
 const s={title:'Other Work',author:'Writer',original_language:'Chinese',
   source_url:'https://www.tadu.com/book/802975'};
 assert.throws(()=>prepareNovelSuggestion(s,[{id:'existing',title:'Existing',author:'Someone',sourceUrl:s.source_url}]));
});
test('accept Korean/English submissions only with supported exact source URLs',()=>{
 const s=prepareNovelSuggestion({title:'Damn Reincarnation',author:'Mokma',
  original_language:'Korean',source_url:'https://www.wuxiaworld.com/novel/damn-reincarnation'},[]);
 assert.equal(s.original_language,'Korean');
 assert.throws(()=>prepareNovelSuggestion({...s,original_language:'Japanese'},[]));
});
