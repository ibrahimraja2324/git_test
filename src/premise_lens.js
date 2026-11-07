/** Reader-selected desires linked to independently written premise snippets.
 * Do NOT convert editorial premise hints into verified plot outcomes.
 */
import {EXPECTATIONS,readLedger,cleanExperience} from './reader_experience.js';
import {coverImg,bindCoverFallback} from './cover_art.js';
const KEY='novalume:discovery-brief:v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TRAITS=new Set(EXPECTATIONS.map(x=>x.id));
export function validatePremises(data,series){
 if(data?.schema!=='novalume.editorial-premise-hints.v1'||!Array.isArray(data.claims))throw Error('Invalid premise hints');
 const byid=new Map(series.map(s=>[s.id,s]));
 const used=new Set();
 for(const c of data.claims){
  if(!c||!byid.has(c.workId)||!TRAITS.has(c.dimension)||c.class!=='editorial-premise'||c.field!=='summary')
   throw Error('Unreviewed premise or unsupported facet');
  const book=byid.get(c.workId);
  if(typeof c.summaryPhrase!=='string'||c.summaryPhrase.length>125||c.summaryPhrase.length<8||!book.summary.includes(c.summaryPhrase))
   throw Error('Missing exact editorial evidence');
  const key=c.workId+'|'+c.dimension;
  if(used.has(key))throw Error('Duplicate premise hint');
  used.add(key);
 }
 return data.claims;
}
export function matchPremises(series,claims,requested,{shelf={},max=15}={}){
 const wanted=[...new Set((Array.isArray(requested)?requested:[]).filter(t=>TRAITS.has(t)))];
 if(!wanted.length)return [];
 const catalog=new Map(series.map(s=>[s.id,s]));
 const matches=new Map();
 for(const c of claims){
  if(!wanted.includes(c.dimension)||!catalog.has(c.workId)||Object.prototype.hasOwnProperty.call(shelf,c.workId))continue;
  if(!matches.has(c.workId))matches.set(c.workId,{series:catalog.get(c.workId),reasons:[]});
  matches.get(c.workId).reasons.push({trait:c.dimension,evidence:c.summaryPhrase});
 }
 return [...matches.values()].sort((a,b)=>b.reasons.length-a.reasons.length||a.series.title.localeCompare(b.series.title))
  .slice(0,Math.max(1,Math.min(40,Number(max)||15)));
}
export function deriveWants(series,ledger){
 const counts=new Map();
 for(const item of series){
  const entry=cleanExperience(ledger?.[item.id]);
  for(const id of entry?.wanted||[])counts.set(id,(counts.get(id)||0)+1);
 }
 return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(x=>x[0]).slice(0,3);
}
export function readBrief(series){
 try{
  const v=JSON.parse(localStorage.getItem(KEY));
  if(v&&Array.isArray(v.wanted))return [...new Set(v.wanted.filter(t=>TRAITS.has(t)))];
 }catch{}
 return deriveWants(series,readLedger(series));
}
export function writeBrief(wanted){
 const clean=[...new Set((Array.isArray(wanted)?wanted:[]).filter(t=>TRAITS.has(t)))];
 localStorage.setItem(KEY,JSON.stringify({wanted:clean}));
 return clean;
}
let promise;
export async function mountPremiseLens(root,series,shelf){
 const target=root.querySelector('#novPremiseLens');
 if(!target)return;
 let claims;
 try{
  if(!promise)promise=fetch('./data/premise_claims.json').then(r=>{if(!r.ok)throw Error('No source index');return r.json()});
  claims=validatePremises(await promise,series);
 }catch{
  promise=null;
  if(target.isConnected)target.innerHTML='<p>Source-grounded premise matching is unavailable. Existing genre matches and reading lists still work.</p>';
  return;
 }
 if(!target.isConnected)return;
 let selected=readBrief(series);
 const render=()=>{
  if(!target.isConnected)return;
  const matches=matchPremises(series,claims,selected,{shelf});
  const allTraits=new Set(claims.map(c=>c.dimension));
  const missing=selected.filter(t=>!allTraits.has(t));
  const label=id=>EXPECTATIONS.find(x=>x.id===id)?.label||id;
  target.innerHTML='<div class="nov-kicker">YOUR NEXT STORY · PREMISE EVIDENCE</div>'+
   '<h2>What do you want the story to deliver?</h2>'+
   '<p>Choose a specific experience. These recommendations use only matching phrases from Novalume-written premise summaries—<strong>not proof of what actually happens</strong>. Your choices stay on this device.</p>'+
   '<div class="nov-premise-chips">'+EXPECTATIONS.map(e=>'<button type="button" data-premise="'+e.id+'" aria-pressed="'+selected.includes(e.id)+'" class="'+(selected.includes(e.id)?'active':'')+'">'+esc(e.label)+'</button>').join('')+'</div>'+
   '<div class="nov-premise-stats">'+(selected.length?matches.length+' potential premise matches. ':'Choose one or more story qualities. ')+
    (missing.length?'No documented premise evidence yet for: '+missing.map(label).map(esc).join(', ')+'. This does not prove those qualities are absent.':'')+'</div>'+
   (selected.length&&!matches.length?'<p class="nov-premise-empty">We do not have enough documented premise evidence for that combination. No made-up matches are shown. Try another quality, or explore verified novels by title.</p>':'')+
   '<div class="nov-premise-results">'+matches.map(item=>{
    const cover=coverImg(item.series,'S');
    return '<article class="nov-premise-card">'+
     '<a class="nov-premise-cover" href="#series/'+esc(item.series.id)+'"><span class="nov-premise-cover-fallback">✦</span>'+cover+'</a>'+
     '<div><h3><a href="#series/'+esc(item.series.id)+'">'+esc(item.series.title)+'</a></h3>'+
     '<p class="nov-premise-sub">'+esc(item.series.author)+' · '+esc(item.series.originalLanguage)+' · '+esc(item.series.sourcePlatform)+'</p>'+
     '<div class="nov-premise-evidence">'+item.reasons.map(reason=>'<p><strong>'+esc(label(reason.trait))+'</strong> · premise phrase: “'+esc(reason.evidence)+'”</p>').join('')+'</div>'+
     '<p class="nov-premise-disclaimer">Editorial premise hint, not a confirmed narrative payoff or reader outcome.</p>'+
     '<a href="#series/'+esc(item.series.id)+'">Inspect source and record your experience →</a></div></article>';
   }).join('')+'</div>'+
   (selected.length?'<p class="nov-premise-caveat">This search only covers '+new Set(claims.map(x=>x.workId)).size+' of '+series.length+' source-linked series with supported summary phrases. Unknown means not researched, not a negative review.</p>':'');
  target.querySelectorAll('[data-premise]').forEach(btn=>btn.onclick=()=>{
   const id=btn.dataset.premise;
   selected=selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];
   try{writeBrief(selected)}catch{} // Browsing still works with storage disabled.
   render();
  });
  bindCoverFallback(target);
 };
 render();
}
