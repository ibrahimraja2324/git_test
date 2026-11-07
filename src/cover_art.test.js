import test from 'node:test';
import assert from 'node:assert/strict';
import {safeCoverArt,coverImg} from './cover_art.js';
const a={provider:'openlibrary',mode:'remote-display',editionId:'OL31573848M',sourceCheckedAt:'2026-11-08',editionUrl:'https://openlibrary.org/books/OL31573848M/Mother_of_Learning'};
const b={provider:'openlibrary',mode:'remote-display',workId:'OL39173307W',workUrl:'https://openlibrary.org/works/OL39173307W',coverId:14718151,sourceCheckedAt:'2026-11-08'};
test('no S thumbnail stretched, M/L for detail and retina',()=>{
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
test('exact work cover ID from Open Library research uses matching source work',()=>{
 assert.equal(safeCoverArt(b),true);
 assert.match(coverImg({title:'Beware of Chicken',coverArt:b},'M'),/\/b\/id\/14718151-M\.jpg\?default=false/);
});
test('unknown cover and malicious URL never generate remote fetch',()=>{
 assert.equal(coverImg({title:'unknown'}),'');
 for(const bad of [
 {...a,editionId:'OL3M" onerror="alert(1)'},
 {...a,editionUrl:'https://openlibrary.org.evil.test/books/OL31573848M/Mother_of_Learning'},
 {...a,editionUrl:'javascript:alert(1)'},
 {...a,mode:'copied'},
 {...a,sourceCheckedAt:'unverified'},
 {...b,workUrl:'https://openlibrary.org.evil.test/works/OL39173307W'},
 {...b,coverId:-7},
 {...b,workId:'../../secret'}
 ])assert.equal(coverImg({title:'x',coverArt:bad}),'');
 assert.ok(coverImg({title:'<script>',coverArt:a}).includes('&lt;script&gt;'));
});
