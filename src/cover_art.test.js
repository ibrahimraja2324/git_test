import test from 'node:test';
import assert from 'node:assert/strict';
import {safeCoverArt,coverImg} from './cover_art.js';
const a={provider:'openlibrary',mode:'remote-display',editionId:'OL31573848M',editionUrl:'https://openlibrary.org/books/OL31573848M/Mother_of_Learning'};
test('remote Open Library small image uses exact matched edition ID',()=>{
 assert.equal(safeCoverArt(a),true);
 const img=coverImg({title:'Mother of Learning',coverArt:a});
 assert.match(img,/covers\.openlibrary\.org\/b\/olid\/OL31573848M-S\.jpg\?default=false/);
 assert.match(img,/loading="lazy"/);
 assert.match(coverImg({title:'M',coverArt:a},'M',true),/OL31573848M-M\.jpg/);
});
test('unknown art and URL injection never render external images',()=>{
 assert.equal(coverImg({title:'unknown'}),'');
 for(const bad of [
  {...a,editionId:'OL3M\" onerror=\"alert(1)'},
  {...a,editionUrl:'https://openlibrary.org.evil.test/books/OL31573848M/Mother_of_Learning'},
  {...a,editionUrl:'javascript:alert(1)'},
  {...a,mode:'copied'}
 ])assert.equal(coverImg({title:'x',coverArt:bad}),'');
 assert.ok(coverImg({title:'<script>',coverArt:a}).includes('&lt;script&gt;'));
});
