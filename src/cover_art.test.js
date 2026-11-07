import test from 'node:test';
import assert from 'node:assert/strict';
import {safeCoverArt,coverImg} from './cover_art.js';
const a={provider:'openlibrary',mode:'remote-display',editionId:'OL31573848M',sourceCheckedAt:'2026-11-08',editionUrl:'https://openlibrary.org/books/OL31573848M/Mother_of_Learning'};
test('never stretch S thumbnail into real jacket',()=>{
 assert.equal(safeCoverArt(a),true);
 const card=coverImg({title:'Mother of Learning',coverArt:a});
 assert.match(card,/OL31573848M-M\.jpg\?default=false/);
 assert.match(card,/OL31573848M-L\.jpg\?default=false 2x/);
 assert.doesNotMatch(card,/OL31573848M-S\.jpg/);
 const hero=coverImg({title:'Mother of Learning',coverArt:a},'L',true);
 assert.match(hero,/OL31573848M-L\.jpg\?default=false/);
 assert.match(hero,/fetchpriority="high"/);
 assert.doesNotMatch(hero,/srcset=/);
});
test('unknown cover and malicious URL never generate remote fetch',()=>{
 assert.equal(coverImg({title:'unknown'}),'');
 for(const bad of [
 {...a,editionId:'OL3M" onerror="alert(1)'},
 {...a,editionUrl:'https://openlibrary.org.evil.test/books/OL31573848M/Mother_of_Learning'},
 {...a,editionUrl:'javascript:alert(1)'},
 {...a,mode:'copied'},
 {...a,sourceCheckedAt:'unverified'}
 ])assert.equal(coverImg({title:'x',coverArt:bad}),'');
 assert.ok(coverImg({title:'<script>',coverArt:a}).includes('&lt;script&gt;'));
});
