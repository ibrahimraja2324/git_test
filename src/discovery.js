/** Novalume discovery club: real indexed work facts, editorial collections, private taste.
 * No fabricated reader activity, cover art, reviews, popularity or engagement.
 */
import {filterDirectory,paginateDirectory,sanitizeShelf} from './directory.js';
import {coverImg,bindCoverFallback} from './cover_art.js';
import {renderExperienceSummary,bindExperienceSummary} from './reader_experience.js';
import {communityClient} from './community.js';
import {mountPremiseLens} from './premise_lens.js';
const KEY='novalume:seriesShelfV1';
const state={query:'',language:'All',status:'All',tag:'All',page:1};
const escape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const el=(root,q)=>root.querySelector(q);
function readShelf(series){
 try{return sanitizeShelf(JSON.parse(localStorage.getItem(KEY)),series);}
 catch{return Object.create(null);}
}
function saveShelf(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
export function ratingOf(value){
 const n=Number(value);
 return Number.isFinite(n)&&n>=.5&&n<=5&&n*2===Math.round(n*2)?n:0;
}
export function tasteProfile(series,shelf){
 const rated=series.filter(s=>ratingOf(shelf[s.id]?.rating)>0);
 const weights=new Map();
 for(const s of rated){
  const weight=ratingOf(shelf[s.id].rating)-2.5;
  for(const g of s.genres)weights.set(g,(weights.get(g)||0)+weight);
 }
 const positive=[...weights.entries()].filter(v=>v[1]>0).sort((a,b)=>b[1]-a[1]);
 const matches=series.filter(s=>!shelf[s.id]).map(s=>{
  const signals=s.genres.map(g=>({name:g,weight:weights.get(g)||0})).filter(x=>x.weight>0)
    .sort((a,b)=>b.weight-a.weight);
  return {series:s,score:signals.reduce((sum,x)=>sum+x.weight,0),reasons:signals.slice(0,3).map(x=>x.name)};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.series.title.localeCompare(b.series.title));
 return {rated:rated.length,positive,matches};
}
function palette(s){let n=0;for(const c of s.id)n=(n*29+c.charCodeAt(0))>>>0;return n%8;}
export function cover(s,extra=''){
 const mark=s.originalLanguage==='Chinese'?'墨':s.originalLanguage==='Korean'?'빛':'✦';
 return '<div class="nov-cover nov-cover-'+palette(s)+' '+extra+'"><small>'+escape(s.originalLanguage)+'</small>'+
 '<span aria-hidden="true">'+mark+'</span><div><strong>'+escape(s.title)+'</strong><em>'+escape(s.author)+'</em></div>'+
 coverImg(s,extra==='hero'?'M':'S',extra==='hero')+'</div>';
}
function poster(s){
 return '<div class="nov-poster"><a href="#series/'+escape(s.id)+'">'+cover(s)+'</a><h3><a href="#series/'+escape(s.id)+'">'+escape(s.title)+'</a></h3>'+
 '<p>'+escape(s.originalLanguage)+' · '+escape(s.genres[0]||'Webnovel')+'</p></div>';
}
function collection(title,subtitle,books,query){
 if(!books.length)return '';
 return '<section class="nov-section"><div class="nov-section-top"><div><div class="nov-kicker">CURATED DISCOVERY</div><h2>'+escape(title)+'</h2><p>'+escape(subtitle)+'</p></div>'+
 '<button type="button" data-nov-topic="'+escape(query)+'">Explore this theme ↗</button></div>'+
 '<div class="nov-poster-row">'+books.slice(0,9).map(poster).join('')+'</div></section>';
}
function card(s,shelf){
 const entry=shelf[s.id],rating=ratingOf(entry?.rating);
 return '<article class="nov-result"><a class="nov-result-cover" href="#series/'+escape(s.id)+'">'+cover(s)+'</a><div class="nov-result-copy">'+
 '<div class="nov-meta">'+escape(s.originalLanguage)+' <span>·</span> '+escape(s.sourcePlatform)+'</div>'+
 '<h3><a href="#series/'+escape(s.id)+'">'+escape(s.title)+'</a></h3><p class="nov-byline">'+escape(s.author)+'</p>'+
 '<p class="nov-summary">'+escape(s.summary)+'</p>'+
 '<div class="nov-tags">'+s.genres.slice(0,3).map(g=>'<span>'+escape(g)+'</span>').join('')+'</div>'+
 '<div class="nov-result-actions"><span>'+ (rating?'★ '+rating.toFixed(1)+' <small>your rating</small>':entry?'In your library':'Not rated')+
 '</span><button type="button" data-nov-save="'+escape(s.id)+'">'+(entry?'Open entry ↗':'+ Add to list')+'</button></div></div></article>';
}
function topGenres(series){const n=new Map();for(const s of series)for(const g of s.genres)n.set(g,(n.get(g)||0)+1);
 return [...n.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).map(x=>x[0]);}
function genreShelf(series,lang,terms){return series.filter(s=>s.originalLanguage===lang&&s.genres.some(g=>terms.some(t=>g.toLowerCase().includes(t))));}
function heroCovers(series){
 return ['mother-of-learning','the-primal-hunter','the-beginning-after-the-end','azarinth-healer']
 .map(id=>series.find(x=>x.id===id)).filter(Boolean).map((s,i)=>'<a class="nov-floating nov-floating-'+i+'" href="#series/'+escape(s.id)+'">'+cover(s,'hero')+'</a>').join('');
}
function revealSection(root,id){el(root,id)?.scrollIntoView({block:'start',behavior:'smooth'});}
function bindSaves(root,series,shelf,rerender){
 root.querySelectorAll('[data-nov-save]').forEach(btn=>btn.onclick=()=>{
  const id=btn.dataset.novSave;
  if(shelf[id]){location.hash='#series/'+encodeURIComponent(id);return;}
  shelf[id]={status:'Plan to read',chapter:0,note:'',rating:0,review:'',reviewSpoiler:false};
  if(saveShelf(shelf))rerender();else alert('Could not save locally. Browser storage may be disabled.');
 });
}
export function renderDiscovery(root,series){
 const shelf=readShelf(series),taste=tasteProfile(series,shelf),totalSaved=Object.keys(shelf).length;
 const base=filterDirectory(series,{q:state.query,language:state.language,status:state.status,
   include:state.tag==='All'?[]:[state.tag]});
 const pages=paginateDirectory(base,state.page,24);state.page=pages.page;
 const chinese=genreShelf(series,'Chinese',['cultivation','xianxia','xuanhuan','progression']);
 const korean=series.filter(s=>s.originalLanguage==='Korean');
 const english=genreShelf(series,'English',['progression','litrpg','time loop']);
 const reading=series.filter(s=>shelf[s.id]?.status==='Reading');
 root.innerHTML='<div class="nov-home"><section class="nov-hero"><div class="content-wrap nov-hero-grid">'+
 '<div class="nov-hero-content"><div class="nov-kicker">A DIFFERENT KIND OF STORY COMMUNITY</div>'+
 '<h1>Find your next <em>obsession.</em></h1>'+
 '<p>Every story deserves to be found. Explore Chinese, Korean and English serial fiction, rate what you love and build your own reading world.</p>'+
 '<form id="nov-search" class="nov-search"><span aria-hidden="true">⌕</span><label class="visually-hidden" for="nov-query">Search novels</label>'+
 '<input id="nov-query" type="search" maxlength="150" value="'+escape(state.query)+'" placeholder="Try regression, time loops, cultivation…">'+
 '<button type="submit">Explore <span aria-hidden="true">→</span></button></form>'+
 '<div class="nov-search-chips"><span>Explore</span><button data-nov-query="Regression">Regression</button><button data-nov-query="Cultivation">Cultivation</button><button data-nov-query="LitRPG">LitRPG</button><button data-nov-query="Time Loop">Time loops</button></div>'+
 '<p class="nov-true-count">'+series.length+' real linked novels <span>·</span> '+totalSaved+' in your library <span>·</span> No fabricated ratings</p></div>'+
 '<div class="nov-floating-wrap">'+heroCovers(series)+'</div></div></section>'+
 '<div class="content-wrap nov-body"><div class="nov-shortcuts">'+
 '<a href="#tracking"><b>▤</b><span><strong>Your reading diary</strong><small>Log chapters, reviews and ratings</small></span></a>'+
 '<a href="#taste"><b>✦</b><span><strong>Discover your taste</strong><small>Find stories sharing themes you love</small></span></a>'+
 '<a href="#community"><b>✧</b><span><strong>Reader community</strong><small>Real reviews, real readers and profiles</small></span></a></div>'+
 (reading.length?collection('Currently in your world','The titles you marked as reading. Your private diary.',reading,''):'')+
 collection('Cultivation & impossible heights','Sects, realms, ambition and ever-expanding worlds.',chinese,'Cultivation')+
 collection('Second chances & bigger stakes','Korean webnovels and dramatic power struggles.',korean,'Regression')+
 collection('Progression without the ceiling','English originals built for long journeys.',english,'Progression')+
 '<section class="nov-taste-banner"><div class="nov-taste-intro"><div class="nov-kicker">YOUR READER DNA</div>'+
 '<h2>'+(taste.rated?'Your taste is taking shape.':'A library that learns what you love.')+'</h2>'+
 '<p>'+(taste.rated?'You rated '+taste.rated+' title(s). Your recommendations use shared documented themes and your ratings, not fake activity.':'Rate the novels you know to unlock transparent matches based on what you actually like.')+'</p>'+
 '<a href="#taste">Explore your taste profile ↗</a></div>'+
 (taste.matches.length?'<a class="nov-taste-feature" href="#series/'+escape(taste.matches[0].series.id)+'">'+cover(taste.matches[0].series)+
 '<span><small>A POTENTIAL MATCH</small><strong>'+escape(taste.matches[0].series.title)+'</strong><em>'+escape(taste.matches[0].reasons.join(' · '))+'</em></span></a>':
 '<div class="nov-taste-empty"><span>✧</span><strong>Your next favourite<br>starts with one rating.</strong></div>')+'</section>'+
 '<section class="nov-catalog" id="nov-catalog"><div class="nov-kicker">THE REAL-TITLE DIRECTORY</div>'+
 '<div class="nov-section-top"><div><h2>Find your kind of story.</h2><p>Search real metadata with source links and traceable provenance.</p></div>'+
 '<div class="nov-catalog-actions"><a href="https://github.com/ibrahimraja2324/git_test/issues/new?title=Novalume%3A%20suggest%20a%20missing%20novel&body=Novel%20title%3A%0AAuthor%3A%0AOriginal%20language%3A%0AOfficial%20or%20legitimate%20source%20URL%3A%0AOther%20source%20references%3A%0A%0APlease%20only%20share%20basic%20factual%20metadata%2C%20not%20chapters%2C%20publisher%20synopses%2C%20cover%20art%20or%20copied%20reviews." target="_blank" rel="noopener noreferrer">+ Suggest a missing novel ↗</a><a href="#tracking" class="nov-browse-link">My library ↗</a></div></div>'+
 '<div class="nov-catalog-layout"><aside class="nov-filters"><div class="nov-filter-top"><strong>Filters</strong><button type="button" id="nov-clear">Clear all</button></div>'+
 '<label for="nov-language">Original language</label><select id="nov-language">'+['All','Chinese','Korean','English'].map(x=>'<option '+(state.language===x?'selected':'')+'>'+x+'</option>').join('')+'</select>'+
 '<label for="nov-status">Original status</label><select id="nov-status">'+['All','Completed','Ongoing','Discontinued','Unknown'].map(x=>'<option '+(state.status===x?'selected':'')+'>'+x+'</option>').join('')+'</select>'+
 '<label for="nov-tag">Story theme</label><select id="nov-tag">'+['All',...topGenres(series)].map(x=>'<option '+(state.tag===x?'selected':'')+'>'+escape(x)+'</option>').join('')+'</select>'+
 '<div class="nov-filter-footnote">Original publication status can differ from English translation or source-site availability.</div></aside>'+
 '<div class="nov-catalog-main"><div class="nov-catalog-toolbar"><span>'+base.length+' actual titles · '+pages.from+'–'+pages.to+'</span><span>Alphabetical · no sponsored rankings</span></div>'+
 (pages.items.length?'<div class="nov-result-grid">'+pages.items.map(s=>card(s,shelf)).join('')+'</div>':
 '<div class="nov-no-results">No matching titles in the current index. <button id="nov-clear-empty" type="button">Clear filters</button></div>')+
 '<div class="nov-pages"><button type="button" id="nov-prev" '+(pages.page===1?'disabled':'')+'>← Previous</button>'+
 '<span>Page '+pages.page+' of '+pages.pages+'</span>'+
 '<button type="button" id="nov-next" '+(pages.page===pages.pages?'disabled':'')+'>Next →</button></div></div></div>'+
 '</section><p class="nov-data-note">These are independently compiled basic facts, editorial descriptions and outbound links. No copyrighted chapters or third-party artwork are mirrored; community ratings and reviews will only appear after real-account launch.</p></div></div>';
 bindCoverFallback(root);
 const update=()=>renderDiscovery(root,series);
 function find(q){state.query=q.trim().slice(0,150);state.page=1;update();revealSection(root,'#nov-catalog')}
 el(root,'#nov-search').onsubmit=e=>{e.preventDefault();find(el(root,'#nov-query').value)};
 root.querySelectorAll('[data-nov-query]').forEach(b=>b.onclick=()=>find(b.dataset.novQuery));
 root.querySelectorAll('[data-nov-topic]').forEach(b=>b.onclick=()=>find(b.dataset.novTopic));
 const clear=()=>{state.query='';state.language='All';state.status='All';state.tag='All';state.page=1;update();revealSection(root,'#nov-catalog')};
 el(root,'#nov-clear').onclick=clear;
 if(el(root,'#nov-clear-empty'))el(root,'#nov-clear-empty').onclick=clear;
 el(root,'#nov-language').onchange=e=>{state.language=e.target.value;state.page=1;update()};
 el(root,'#nov-status').onchange=e=>{state.status=e.target.value;state.page=1;update()};
 el(root,'#nov-tag').onchange=e=>{state.tag=e.target.value;state.page=1;update()};
 el(root,'#nov-prev').onclick=()=>{state.page--;update();revealSection(root,'#nov-catalog')};
 el(root,'#nov-next').onclick=()=>{state.page++;update();revealSection(root,'#nov-catalog')};
 bindSaves(root,series,shelf,update);
}
export function renderTaste(root,series){
 const shelf=readShelf(series),profile=tasteProfile(series,shelf),rated=series.filter(s=>ratingOf(shelf[s.id]?.rating));
 root.innerHTML='<div class="nov-taste-page"><section class="nov-profile-hero"><div class="content-wrap">'+
 '<div class="nov-kicker">PERSONAL TASTE PROFILE · PRIVATE ON THIS DEVICE</div>'+
 '<h1>A better recommendation begins <em>with you.</em></h1>'+
 '<p>Your ratings determine possible theme matches. No imaginary community scores, AI fees, or fake people.</p>'+
 '<div class="nov-profile-tallies"><strong>'+profile.rated+'</strong><span>rated novels</span><strong>'+profile.matches.length+'</strong><span>potential matches</span></div></div></section>'+
 '<div class="content-wrap nov-profile-content">'+
 (rated.length?'<section class="nov-section"><div class="nov-kicker">YOUR SHELF</div><h2>Stories you rated</h2>'+
 '<div class="nov-poster-row">'+rated.map(poster).join('')+'</div></section>':'<section class="nov-empty"><h2>Your taste profile is waiting.</h2><p>Open a novel you have read and rate it. Better matches emerge as you score a few different stories.</p><a href="#home">Browse real novels ↗</a></section>')+
 '<section class="nov-section"><div class="nov-kicker">POSITIVE SIGNALS</div><h2>What seems to click</h2>'+
 (profile.positive.length?'<div class="nov-tag-cloud">'+profile.positive.slice(0,10).map(([name])=>'<span>'+escape(name)+'</span>').join('')+'</div>':
 '<p>No positive taste signals yet. This will reflect your private ratings, not invented interests.</p>')+'</section>'+
 '<section class="nov-premise-lens" id="novPremiseLens"><p>Opening source-grounded story matching…</p></section>'+'<section class="nov-section"><div class="nov-kicker">BASED ON YOUR RATINGS</div><h2>Genre-only baseline matches</h2>'+
 (profile.matches.length?'<div class="nov-result-grid">'+profile.matches.slice(0,18).map(x=>card(x.series,shelf)).join('')+'</div>':
 '<p>Rate a few titles you enjoyed to get matches from the real indexed catalogue.</p>')+'</section>'+
 renderExperienceSummary(series)+'<p class="nov-data-note">Your reading-experience evidence is private on this device unless you explicitly choose to back it up; it is not a verified plot-knowledge source.</p></div></div>';
 bindCoverFallback(root);
 bindExperienceSummary(root,series,communityClient);
 mountPremiseLens(root,series,shelf);
 bindSaves(root,series,shelf,()=>renderTaste(root,series));
}
