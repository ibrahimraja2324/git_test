import test from 'node:test';
import assert from 'node:assert/strict';
import {cover,ratingOf,tasteProfile} from './discovery.js';
const series=[
 {id:'alpha',title:'Cultivation of Worlds',author:'Writer A',genres:['Cultivation','Progression'],originalLanguage:'Chinese'},
 {id:'beta',title:'Secret Academy',author:'Writer B',genres:['Academy','Romance'],originalLanguage:'Korean'},
 {id:'gamma',title:'The Endless Dao',author:'Writer C',genres:['Cultivation','Progression'],originalLanguage:'Chinese'},
 {id:'delta',title:'Quiet Love',author:'Writer D',genres:['Romance','Slice of Life'],originalLanguage:'English'}
];
test('private half-star ratings are bounded and can never be arbitrary',()=>{
 assert.equal(ratingOf(4.5),4.5);assert.equal(ratingOf(0),0);
 assert.equal(ratingOf(1.3),0);assert.equal(ratingOf('4.0'),4);
 assert.equal(ratingOf(-1),0);assert.equal(ratingOf(6),0);
});
test('taste matches use positively rated shared themes and exclude saved stories',()=>{
 const shelf={alpha:{status:'Completed',rating:5},beta:{status:'Completed',rating:1}};
 const result=tasteProfile(series,shelf);
 assert.equal(result.rated,2);
 assert.equal(result.matches[0].series.id,'gamma');
 assert.deepEqual(result.matches[0].reasons,['Cultivation','Progression']);
 assert.ok(result.matches.every(x=>!shelf[x.series.id]));
 assert.ok(!result.matches.some(x=>x.series.id==='delta'));
});
test('no fabricated matching results if nothing was rated',()=>{
 const result=tasteProfile(series,{alpha:{status:'Reading',rating:0}});
 assert.equal(result.rated,0);
 assert.deepEqual(result.matches,[]);
});
test('rights-safe cover treatments escape all user-provided title data',()=>{
 const item={id:'hello',title:'<script>alert(1)</script>',author:'A & B',originalLanguage:'English'};
 const art=cover(item);
 assert.ok(!art.includes('<script>'));
 assert.ok(art.includes('&lt;script&gt;'));
 assert.ok(art.includes('A &amp; B'));
 assert.ok(!art.includes('src="http'));
});
