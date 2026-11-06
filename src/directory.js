/** Novel-directory layer: legitimate metadata cards, NOT hosted copies of linked books.
 * External reading data remains on source platforms; personal lists stay on this device.
 */
export const LIST_STATUSES = ['Plan to read','Reading','Completed','On hold','Dropped'];
export const LANGUAGES = ['All','Chinese','Korean','English'];
const STORAGE = 'novalume:seriesShelfV1';
const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceHosts = new Set(['www.novelupdates.com','www.royalroad.com','www.wuxiaworld.com']);
const cleanWords = v => String(v ?? '').toLocaleLowerCase().trim().replace(/\s+/g,' ');
const clampChapter = n => Number.isSafeInteger(Number(n)) && Number(n) >= 0 && Number(n) <= 1000000 ? Number(n) : 0;
const viewState = {q:'',language:'All',status:'All',include:new Set(),exclude:new Set(),page:1};
function elem(root, selector){return root.querySelector(selector)}
function sourceValid(url){
 try {const u=new URL(url);return u.protocol==='https:'&&sourceHosts.has(u.hostname)&&!u.username&&!u.password;}
 catch {return false;}
}
export function validateDirectory(data){
 if(!data||data.schema!=='novalume.external-series.v1'||!Array.isArray(data.series))throw Error('Invalid series directory');
 const seen = new Set();
 for(const entry of data.series){
  if(typeof entry.id!=='string'||!/^[-a-z0-9]+$/.test(entry.id)||seen.has(entry.id))throw Error('Invalid series ID');
  seen.add(entry.id);
  if(!entry.title||!entry.author||!sourceValid(entry.sourceUrl)||entry.kind!=='external-index'||!LANGUAGES.includes(entry.originalLanguage))throw Error('Invalid sourced series');
  if(!Array.isArray(entry.genres)||entry.genres.length===0||!Array.isArray(entry.aliases))throw Error('Invalid genres');
 }
 return data.series;
}
export function filterDirectory(series,options={}){
 const q=cleanWords(options.q);
 const terms=q.split(' ').filter(Boolean);
 const language=options.language||'All';
 const status=options.status||'All';
 const included=Array.from(options.include||[]);
 const excluded=Array.from(options.exclude||[]);
 return series.filter(item=>{
  if(language!=='All'&&item.originalLanguage!==language)return false;
  if(status!=='All'&&item.workStatus!==status)return false;
  const genres=item.genres.map(cleanWords);
  if(included.some(tag=>!genres.includes(cleanWords(tag))))return false;
  if(excluded.some(tag=>genres.includes(cleanWords(tag))))return false;
  if(!terms.length)return true;
  const searchable=cleanWords([item.title,item.author,item.summary,item.originalLanguage,...item.genres,...item.aliases].join(' '));
  return terms.every(term=>searchable.includes(term));
 }).sort((a,b)=>a.title.localeCompare(b.title));
}
export function paginateDirectory(series,page=1,size=24){
 const safeSize=Math.min(50,Math.max(5,Number.isInteger(size)?size:24));
 const pages=Math.max(1,Math.ceil(series.length/safeSize));
 const current=Math.min(pages,Math.max(1,Number.isInteger(page)?page:1));
 return {items:series.slice((current-1)*safeSize,current*safeSize),page:current,
   pages,total:series.length,from:series.length?((current-1)*safeSize+1):0,
   to:Math.min(series.length,current*safeSize)};
}
export function sanitizeShelf(snapshot,series){
 const allow=new Set(series.map(s=>s.id));
 const safe=Object.create(null);
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return safe;
 for(const [id,entry] of Object.entries(snapshot)){
  if(!allow.has(id)||!entry||typeof entry!=='object'||!LIST_STATUSES.includes(entry.status))continue;
  safe[id]={status:entry.status,chapter:clampChapter(entry.chapter),note:String(entry.note||'').slice(0,500)};
 }
 return safe;
}
function loadShelf(series){
 try{return sanitizeShelf(JSON.parse(localStorage.getItem(STORAGE)),series)}
 catch{return Object.create(null)}
}
function persistShelf(shelf){
 try{localStorage.setItem(STORAGE,JSON.stringify(shelf));return true}
 catch{return false}
}
function tile(item,size=''){
 const glyph=item.originalLanguage==='Chinese'?'中':item.originalLanguage==='Korean'?'한':'✦';
 const color=item.originalLanguage==='Chinese'?'#9b524e':item.originalLanguage==='Korean'?'#4e7294':'#6d598d';
 return '<div class="db-cover '+size+'" style="--db-cover:'+color+'"><span class="db-cover-symbol">'+glyph+'</span><strong>'+escape(item.title)+'</strong><small>'+escape(item.author)+'</small></div>';
}
function tag(item){
 return '<span class="db-tag">'+escape(item)+'</span>';
}
function card(item,shelf){
 const saved=shelf[item.id];
 return '<article class="db-card"><a href="#series/'+escape(item.id)+'" class="db-card-art">'+tile(item)+'</a>'+
 '<div class="db-card-body"><div class="db-card-meta">'+escape(item.originalLanguage)+' · '+escape(item.sourcePlatform)+' · '+escape(item.workStatus)+'</div>'+
 '<h3><a href="#series/'+escape(item.id)+'">'+escape(item.title)+'</a></h3><p class="db-author">'+escape(item.author)+'</p>'+
 '<p class="db-description">'+escape(item.summary)+'</p>'+
 '<div class="db-tags">'+item.genres.slice(0,4).map(tag).join('')+'</div>'+
 '<div class="db-card-actions"><a href="#series/'+escape(item.id)+'">Series details →</a><button type="button" data-db-quick="'+escape(item.id)+'" aria-label="'+(saved?'Edit':'Add')+' '+escape(item.title)+' in my list">'+(saved?'✓ On my list':'+ Track')+'</button></div></div></article>';
}
function filterTags(series){
 const counts=new Map();
 for(const item of series)for(const label of item.genres)counts.set(label,(counts.get(label)||0)+1);
 return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(x=>x[0]).slice(0,28);
}
export function mountDirectory(root,series){
 const shelf=loadShelf(series),matches=filterDirectory(series,viewState);
 const pagination=paginateDirectory(matches,viewState.page);viewState.page=pagination.page;
 const popularTags=filterTags(series);
 const totals={Chinese:series.filter(s=>s.originalLanguage==='Chinese').length,Korean:series.filter(s=>s.originalLanguage==='Korean').length,English:series.filter(s=>s.originalLanguage==='English').length};
 root.innerHTML='<section class="db-hero"><div class="content-wrap"><div class="eyebrow small">NOVALUME · WEBNOVEL DATABASE</div>'+
 '<h1>Track the stories.<br><em>Find your next obsession.</em></h1>'+
 '<p>Discover real Chinese, Korean, and English webnovels. Search by source-listed themes, keep reading lists, and follow links to their publishers or series pages.</p>'+
 '<form id="dbSearchForm" class="db-search-form"><label class="visually-hidden" for="dbQuery">Search series, authors, themes or aliases</label>'+
 '<input id="dbQuery" type="search" maxlength="150" value="'+escape(viewState.q)+'" placeholder="Cultivation, regression, time loop, character name…">'+
 '<button type="submit">Find stories</button></form>'+
 '<div class="db-counts"><span>'+series.length+' sourced series</span><span>'+totals.Chinese+' Chinese</span><span>'+totals.Korean+' Korean</span><span>'+totals.English+' English originals</span></div>'+
 '</div></section>'+
 '<section class="content-wrap db-discovery"><div class="db-section-heading"><div><h2>Series directory</h2><p>Real source records — not invented recommendations, scraped chapters, or artificial ratings.</p></div>'+
 '<a href="#tracking" class="db-shelf-link">My reading lists →</a></div>'+
 '<div class="db-layout"><aside class="db-filters"><div class="db-filter-head"><strong>Refine results</strong><button type="button" id="dbReset">Reset</button></div>'+
 '<label for="dbLanguage">Original language</label><select id="dbLanguage">'+LANGUAGES.map(l=>'<option value="'+escape(l)+'" '+(viewState.language===l?'selected':'')+'>'+escape(l)+'</option>').join('')+'</select>'+
 '<label for="dbStatus">Original work status</label><select id="dbStatus">'+['All','Completed','Ongoing','Discontinued','Unknown'].map(l=>'<option value="'+l+'" '+(viewState.status===l?'selected':'')+'>'+l+'</option>').join('')+'</select>'+
 '<h3>Story themes <span>tap to include, then exclude</span></h3>'+
 '<div class="db-filter-tags">'+popularTags.map(label=>{
 const mode=viewState.include.has(label)?'include':viewState.exclude.has(label)?'exclude':'neutral';
 return '<button type="button" data-db-theme="'+escape(label)+'" class="db-theme '+mode+'" aria-label="'+escape(label)+' filter: '+mode+'" title="Tap: require, exclude, clear">'+escape(label)+(mode==='include'?' ✓':mode==='exclude'?' −':'')+'</button>';
 }).join('')+'</div><p class="db-filter-note">Themes are source-listed or editorial labels, not verified narrative-event claims.</p></aside>'+
 '<div class="db-main"><div class="db-results-bar"><span>'+matches.length+' matching series · showing '+pagination.from+'–'+pagination.to+'</span><span>Sorted by title · No paid rankings</span></div>'+
 (matches.length?'<div class="db-results-grid">'+pagination.items.map(item=>card(item,shelf)).join('')+'</div>':
 '<div class="db-no-results"><h3>No matching series yet</h3><p>Remove a filter or try a broader theme. The directory is being expanded from independently checked sources.</p><button id="dbResetEmpty" type="button">Clear filters</button></div>')+
 '<div class="db-pages" aria-label="Series results pagination">'+
 '<button type="button" id="dbPrev" '+(pagination.page===1?'disabled':'')+'>← Previous</button>'+
 '<span>Page '+pagination.page+' / '+pagination.pages+'</span>'+
 '<button type="button" id="dbNext" '+(pagination.page===pagination.pages?'disabled':'')+'>Next →</button>'+
 '</div></div></div><div class="db-launch-panel"><div><h3>Want to read or publish here?</h3><p>Novalume also hosts rights-cleared reading editions. Original-author publishing is being developed; private drafts are available now.</p></div>'+
 '<div><a href="#read-here" class="db-panel-link">Read on Novalume →</a><a href="#studio" class="db-panel-link">Write a private draft →</a></div></div>'+
 '<p class="db-rights-note">Linked series remain on their original platforms. We do not mirror copyrighted chapters, track live release updates, or imply a licensing relationship with their publishers.</p></section>';
 const refresh=()=>mountDirectory(root,series);
 elem(root,'#dbSearchForm').onsubmit=e=>{e.preventDefault();viewState.q=elem(root,'#dbQuery').value.trim().slice(0,150);viewState.page=1;refresh()};
 elem(root,'#dbLanguage').onchange=e=>{viewState.language=e.target.value;viewState.page=1;refresh()};
 elem(root,'#dbStatus').onchange=e=>{viewState.status=e.target.value;viewState.page=1;refresh()};
 const clear=()=>{viewState.q='';viewState.language='All';viewState.status='All';viewState.include.clear();viewState.exclude.clear();viewState.page=1;refresh()};
 elem(root,'#dbReset').onclick=clear;
 if(elem(root,'#dbResetEmpty'))elem(root,'#dbResetEmpty').onclick=clear;
 root.querySelectorAll('[data-db-theme]').forEach(el=>el.onclick=()=>{
  const value=el.dataset.dbTheme;
  if(viewState.include.has(value)){viewState.include.delete(value);viewState.exclude.add(value)}
  else if(viewState.exclude.has(value))viewState.exclude.delete(value);
  else viewState.include.add(value);
  viewState.page=1;refresh();
 });
 elem(root,'#dbPrev').onclick=()=>{viewState.page=Math.max(1,viewState.page-1);refresh()};
 elem(root,'#dbNext').onclick=()=>{viewState.page=Math.min(pagination.pages,viewState.page+1);refresh()};
 root.querySelectorAll('[data-db-quick]').forEach(el=>el.onclick=()=>{
  const id=el.dataset.dbQuick;
  if(shelf[id]){location.hash='#series/'+encodeURIComponent(id);return}
  shelf[id]={status:'Plan to read',chapter:0,note:''};
  if(persistShelf(shelf))refresh();else alert('Browser storage is unavailable. You can still open series details.');
 });
}
export function mountSeries(root,series,id){
 const item=series.find(s=>s.id===id);
 if(!item){root.innerHTML='<section class="content-wrap db-discovery"><h2>Series not found</h2><a href="#home">Return to discovery →</a></section>';return}
 const shelf=loadShelf(series), current=shelf[id]||{status:'Plan to read',chapter:0,note:''};
 root.innerHTML='<div class="content-wrap db-series-page"><a class="back-link" href="#home">← Back to directory</a>'+
 '<div class="db-series-hero"><div class="db-series-art">'+tile(item,'large')+'</div><div class="db-series-content">'+
 '<div class="eyebrow small">'+escape(item.originalLanguage)+' WEBNOVEL · '+escape(item.workStatus)+'</div>'+
 '<h1>'+escape(item.title)+'</h1><p class="db-series-author">by '+escape(item.author)+'</p>'+
 '<p class="db-series-summary">'+escape(item.summary)+'</p><div class="db-tags">'+item.genres.map(tag).join('')+'</div>'+
 '<div class="db-series-actions"><a class="btn primary" href="'+escape(item.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Open '+escape(item.sourcePlatform)+' ↗</a>'+
 '<a class="btn secondary" href="#tracking">My list →</a></div>'+
 '<p class="db-rights-note">External index only. The source page controls chapter access, translation availability and pricing. No novel text is hosted here.</p></div></div>'+
 '<div class="db-series-lower"><section><h2>Your reading progress</h2><p class="muted">Keep track manually across platforms. These private notes are stored only in this browser.</p>'+
 '<form id="dbTrackForm" class="db-track-form"><label>List status<select id="dbTrackStatus">'+LIST_STATUSES.map(st=>'<option '+(current.status===st?'selected':'')+'>'+st+'</option>').join('')+'</select></label>'+
 '<label>Last chapter read<input id="dbTrackChapter" inputmode="numeric" type="number" min="0" max="1000000" step="1" value="'+current.chapter+'"></label>'+
 '<label class="db-note-label">Private note<textarea id="dbTrackNote" rows="3" maxlength="500" placeholder="Your thoughts, next chapter, etc.">'+escape(current.note)+'</textarea></label>'+
 '<div class="db-form-actions"><button class="btn primary" type="submit">Save to my list</button><button class="btn secondary" type="button" id="dbRemove">Remove from my list</button></div>'+
 '<p class="db-form-feedback" id="dbTrackMessage" role="status"></p></form></section>'+
 '<aside class="db-source-info"><h3>Record provenance</h3><dl><dt>Source</dt><dd>'+escape(item.sourcePlatform)+'</dd><dt>Original language</dt><dd>'+escape(item.originalLanguage)+'</dd>'+
 '<dt>Original work status</dt><dd>'+escape(item.workStatus)+'</dd><dt>Record updated</dt><dd>'+escape(item.verifiedAt)+'</dd><dt>Source confidence</dt><dd>'+escape(item.sourceConfidence||'Review pending')+'</dd><dt>Cross-checked sources</dt><dd>'+escape(item.sourceCount??0)+'</dd><dt>Chapter availability</dt><dd>'+escape(item.availabilityStatus||'Check source')+'</dd></dl>'+
 '<a href="'+escape(item.sourceUrl)+'" target="_blank" rel="noopener noreferrer">View cited record ↗</a>'+
 '<p>Original completion, translation progress and chapters available here are different questions. This is not a live feed.</p>'+
 (item.sourceReferences?.length?'<div class="db-source-provenance"><h4>Reviewed source pages</h4>'+item.sourceReferences.map(ref=>'<a href="'+escape(ref.url)+'" rel="noopener noreferrer" target="_blank">'+escape(ref.name)+' ↗</a>').join('')+'</div>':'<p class="db-source-pending">Independent checking is still pending.</p>')+
 (item.sourceDisagreements?.length?'<p class="db-source-conflict">Sources disagree about: '+escape(item.sourceDisagreements.join(', '))+'. Treat those facts as uncertain.</p>':'')+
 '</aside></div></div>';
 elem(root,'#dbTrackForm').onsubmit=e=>{
  e.preventDefault();
  const raw=Number(elem(root,'#dbTrackChapter').value);
  if(!Number.isSafeInteger(raw)||raw<0||raw>1000000){elem(root,'#dbTrackMessage').textContent='Enter a whole chapter number between 0 and 1,000,000.';return}
  shelf[id]={status:elem(root,'#dbTrackStatus').value,chapter:raw,note:elem(root,'#dbTrackNote').value.slice(0,500)};
  elem(root,'#dbTrackMessage').textContent=persistShelf(shelf)?'Saved on this device.':'Could not save: browser storage is unavailable.';
 };
 elem(root,'#dbRemove').onclick=()=>{
  delete shelf[id];
  if(persistShelf(shelf))mountSeries(root,series,id);
  else elem(root,'#dbTrackMessage').textContent='Could not update browser storage.';
 };
}
/** Shared lists contain ONLY source-verified IDs, never private notes or chapter history. */
export function shareIds(snapshot,series){
 const valid=new Set(series.map(s=>s.id));
 return Object.keys(snapshot||{}).filter(id=>valid.has(id)).sort().slice(0,24);
}
export function parseSharedIds(segment,series){
 const valid=new Set(series.map(s=>s.id));
 if(typeof segment!=='string'||segment.length>1000)return [];
 return [...new Set(segment.split(',').map(s=>s.trim()).filter(id=>/^[-a-z0-9]+$/.test(id)&&valid.has(id)))].slice(0,24);
}
export function mountSharedList(root,series,segment){
 const ids=parseSharedIds(segment,series);
 const items=ids.map(id=>series.find(s=>s.id===id)).filter(Boolean);
 root.innerHTML='<section class="db-hero db-small-hero"><div class="content-wrap"><div class="eyebrow small">A SHAREABLE NOVEL LIST</div>'+
 '<h1>Stories worth <em>sharing.</em></h1><p>A reader has collected these series. This is a portable selection of public titles, not a public account or an endorsement.</p></div></section>'+
 '<section class="content-wrap db-discovery"><div class="db-section-heading"><div><h2>'+items.length+' selected '+(items.length===1?'story':'stories')+'</h2><p>No private notes or chapter progress are shared in this link.</p></div><a class="db-shelf-link" href="#home">Explore the directory →</a></div>'+
 (items.length?'<div class="db-results-grid">'+items.map(item=>card(item,{})).join('')+'</div>':
 '<div class="db-no-results"><h3>This shared list is empty or invalid</h3><a href="#home">Find a story →</a></div>')+
 '</section>';
 root.querySelectorAll('[data-db-quick]').forEach(el=>el.onclick=()=>{
  const id=el.dataset.dbQuick,shelf=loadShelf(series);
  if(shelf[id]){location.hash='#series/'+encodeURIComponent(id);return}
  shelf[id]={status:'Plan to read',chapter:0,note:''};
  if(persistShelf(shelf))mountSharedList(root,series,segment);
 });
}

export function mountTracking(root,series){
 const shelf=loadShelf(series),entries=series.filter(s=>shelf[s.id]);
 const totals=LIST_STATUSES.map(status=>[status,entries.filter(e=>shelf[e.id].status===status).length]);
 root.innerHTML='<section class="db-hero db-small-hero"><div class="content-wrap"><div class="eyebrow small">YOUR PERSONAL NOVEL LISTS</div>'+
 '<h1>Keep every world <em>in reach.</em></h1><p>Track your Chinese, Korean and English webnovels across their original platforms. Your list is private on this device.</p></div></section>'+
 '<section class="content-wrap db-discovery"><div class="db-section-heading"><div><h2>Reading tracker</h2><p>'+entries.length+' saved series · Manual chapter progress</p></div><a href="#home" class="db-shelf-link">Find more novels →</a></div>'+
 '<div class="db-tracker-chips">'+totals.map(([status,count])=>'<span>'+escape(status)+' <strong>'+count+'</strong></span>').join('')+'</div>'+
 '<div class="db-list-toolbar"><button id="dbShare" type="button">Share a public list link</button><button id="dbExport" type="button">Export private lists (.json)</button><label class="db-import-label">Import saved lists<input id="dbImport" type="file" accept="application/json,.json"></label><span id="dbImportMessage" role="status"></span></div>'+
 (entries.length?'<div class="db-tracked-grid">'+entries.map(entry=>{
 const d=shelf[entry.id];
 return '<article class="db-tracked-card"><a href="#series/'+escape(entry.id)+'" class="db-tracked-head"><strong>'+escape(entry.title)+'</strong><span>→</span></a>'+
 '<p>'+escape(d.status)+' · Chapter '+d.chapter+'</p><small>'+escape(entry.originalLanguage)+' · '+escape(entry.sourcePlatform)+'</small>'+
 (d.note?'<p class="db-tracked-note">'+escape(d.note)+'</p>':'')+
 '<div class="db-tracked-actions"><a href="#series/'+escape(entry.id)+'">Edit progress</a><a href="'+escape(entry.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Source ↗</a></div></article>';
 }).join('')+'</div>':'<div class="db-no-results"><h3>No series saved yet</h3><p>Open any real webnovel in the directory and select a reading status. No account needed.</p><a class="btn primary" href="#home">Browse webnovels →</a></div>')+
 '<div class="db-launch-panel"><div><h3>Read on Novalume too</h3><p>Our separate reader hosts only editions cleared for publication, with their actual chapters and bookmarks.</p></div><a class="db-panel-link" href="#read-here">Open in-site reader →</a></div></section>';
 elem(root,'#dbShare').onclick=async()=>{
  const ids=shareIds(shelf,series);
  const message=elem(root,'#dbImportMessage');
  if(!ids.length){message.textContent='Add a series before sharing a list.';return}
  const url=location.origin+location.pathname+'#list/'+ids.join(',');
  try{await navigator.clipboard.writeText(url);message.textContent='Public title-only list URL copied.'}
  catch{message.innerHTML='<label class="db-share-fallback">Copy this link: <input readonly aria-label="Shareable public list URL"></label>';const input=message.querySelector('input');input.value=url;input.select()}
 };
 elem(root,'#dbExport').onclick=()=>{
  const data=JSON.stringify({schema:'novalume.personal-reading-list.v1',createdAt:new Date().toISOString(),entries:shelf},null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download='novalume-reading-lists.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 elem(root,'#dbImport').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  const message=elem(root,'#dbImportMessage');
  if(file.size>200000){message.textContent='File too large. Maximum 200 KB.';return}
  try{
   const data=JSON.parse(await file.text());
   if(data.schema!=='novalume.personal-reading-list.v1'||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('Unsupported export format');
   const imported=sanitizeShelf(data.entries,series);
   if(!persistShelf(imported))throw Error('Browser storage unavailable');
   mountTracking(root,series);
   const el=elem(root,'#dbImportMessage');if(el)el.textContent='Your imported list was restored.';
  }catch(err){message.textContent='Could not import: '+String(err.message||'invalid file').slice(0,90)}
 };
}
