import {buildContextPacket,evidenceForQuestion,contextPrompt,askLocalModel} from './knowledge.js';
import {validateDirectory,mountDirectory,mountSeries,mountTracking} from './directory.js';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const local=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(`novalume:${key}`))??fallback}catch{return fallback}};
const save=(key,val)=>{try{localStorage.setItem(`novalume:${key}`,JSON.stringify(val));return true}catch{return false}};
const state={directory:[],catalog:[],favorites:local('favorites',[]),progress:local('progress',{}),preferred:local('preferred',[]),drafts:local('drafts',[]),query:'',genre:'All',theme:local('theme','dark'),readerScale:local('readerScale',19),showSpoilers:false,selectedBook:null,storyIndex:null,knowledgeCache:new Map(),bookCache:new Map()};
const view=$('#view');
function toast(s){const el=$('#toast');el.textContent=s;el.classList.add('visible');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('visible'),3000)}
function icon(name){let d={arrow:'→',sparkle:'✦',heart:'♡',bookmark:'◇',check:'✓',book:'▤',bolt:'✳',search:'⌕',chevron:'›'};return d[name]||name}
function bookCover(book,kind=''){
  const [a,b]=book.colors||['#3c3654','#1a1a26'];
  return `<div class="book-cover ${kind}" style="--cover-a:${escape(a)};--cover-b:${escape(b)}"><div class="cover-grain"></div><div class="cover-frame"><span class="cover-mark">${escape(book.mark||'✦')}</span><span class="cover-title">${escape(book.title)}</span><span class="cover-author">${escape(book.author)}</span></div></div>`;
}
function bookCard(b){
 const liked=state.favorites.includes(b.id),resume=Math.max(1,Math.min(Number(state.progress[b.id]||1),b.chapterCount));
 const sample=b.hostedScope==='sample';
 return `<article class="book-card" data-book="${escape(b.id)}">
  <div class="card-art"><a class="cover-link" href="#book/${escape(b.id)}" aria-label="View ${escape(b.title)}">${bookCover(b)}</a><button class="save-book ${liked?'saved':''}" aria-label="${liked?'Remove':'Add'} ${escape(b.title)} ${liked?'from':'to'} your library" data-save="${escape(b.id)}">${liked?'♥':'♡'}</button>${sample?'<span class="cover-tag">Chapter sample</span>':''}</div>
  <div class="card-info"><div class="card-meta"><span>${escape(b.genre)}</span><span class="meta-dot">·</span><span>${b.chapterCount} ${b.chapterCount===1?'section':'sections'}</span></div>
  <h3><a href="#book/${escape(b.id)}">${escape(b.title)}</a></h3><p class="byline">by ${escape(b.author)}</p>
  <p class="card-blurb">${escape(b.blurb)}</p>
  <div class="real-book-meta">${(Number(b.wordCount)||0).toLocaleString('en-AU')} words · ${b.publicationYear?`first published ${b.publicationYear}`:'original text'}</div>
  <a class="card-read" href="#read/${escape(b.id)}/${resume}">${state.progress[b.id]?'Continue reading':'Start reading'} <span>→</span></a></div>
 </article>`;
}
function emptyBooks(message){return `<div class="empty-results"><div class="empty-icon">⌕</div><h3>Nothing matched — yet.</h3><p>${escape(message)}</p><button class="btn secondary" id="clearFilters">Clear filters</button></div>`}
function renderHome(){
 const all=state.catalog.filter(b=>b.status==='ready');
 const visible=all.filter(b=>state.genre==='All'||b.genre===state.genre);
 const categories=['All',...new Set(all.map(b=>b.genre).filter(Boolean))];
 const sections=all.reduce((n,b)=>n+b.chapterCount,0);
 const resume=Object.keys(state.progress).map(getBook).filter(b=>b&&all.some(x=>x.id===b.id))
   .sort((a,b)=>(state.progress[b.id]||0)-(state.progress[a.id]||0))[0];
 view.innerHTML=`<section class="simple-hero real-hero"><div class="content-wrap compact-hero-inner">
  <div class="eyebrow small">NOVALUME READER LIBRARY</div>
  <h1>Find a story.<br/><em>Keep reading.</em></h1>
  <p>Read genuine chapter text from reviewed editions. Browse the collection, pick up where you left off, or search within available books.</p>
  <form id="searchForm" class="simple-search" role="search"><label class="visually-hidden" for="searchInput">Search hosted novel text</label><input id="searchInput" type="search" placeholder="Search real text: Transylvania, Elizabeth, laboratory…" value="${escape(state.query)}" autocomplete="off" maxlength="500"/><button type="submit">Search →</button></form>
  <div class="hint-row"><span>Explore</span><button type="button" data-query="Transylvania">Transylvania</button><button type="button" data-query="Victor">Victor</button><button type="button" data-query="Mr. Bennet">Mr. Bennet</button></div>
  <div class="real-library-stats"><span>${all.length} readable ${all.length===1?'book':'books'}</span><span>${sections} available sections</span><span>Free to read · No account required</span></div>
 </div></section>
 <section class="content-wrap simple-discovery">
 ${resume?`<a class="continue-banner" href="#read/${escape(resume.id)}/${Math.max(1,Number(state.progress[resume.id])||1)}"><span class="continue-symbol">↗</span><span><span class="eyebrow small">PICK UP WHERE YOU LEFT OFF</span><strong>${escape(resume.title)}</strong><small>Section ${state.progress[resume.id]} of ${resume.chapterCount} · Saved on this device</small></span><span class="continue-arrow">Continue →</span></a>`:''}
 ${state.query?`<section class="live-search-area"><div class="quick-row"><div><h2>Text search</h2><p>Searching the actual hosted chapters. Matches are textual, not verified interpretations of plot events.</p></div><button type="button" id="clearQuery" class="small-link">Clear search</button></div><div id="privateResults" class="real-search-results" aria-live="polite"><p class="muted">Looking in the indexed book text…</p></div></section>`:''}
 <div class="quick-row"><div><h2>Read now</h2><p>Every book below has real chapters you can open. The catalogue expands only when new editions are cleared and imported.</p></div><a class="small-link" href="#library">Local reading shelf →</a></div>
 <div class="category-pills compact-pills">${categories.map(g=>`<button type="button" class="category-pill ${state.genre===g?'active':''}" data-genre="${escape(g)}">${escape(g)}</button>`).join('')}</div>
 ${visible.length?`<div class="book-grid compact-books real-book-grid">${visible.map(bookCard).join('')}</div>`:'<p class="muted">No hosted editions in this category yet.</p>'}
 <div class="real-integrity-note">Only books with actual chapter files are shown here. Titles awaiting rights review or import are not presented as readable books. <a href="#rights">How sources are checked →</a></div>
 </section>`;
 bindCards();
 $('#searchForm').addEventListener('submit',e=>{e.preventDefault();state.query=$('#searchInput').value.trim();renderHome()});
 $$('[data-genre]').forEach(el=>el.addEventListener('click',()=>{state.genre=el.dataset.genre;renderHome()}));
 $$('[data-query]').forEach(el=>el.addEventListener('click',()=>{state.query=el.dataset.query;renderHome()}));
 $('#clearQuery')?.addEventListener('click',()=>{state.query='';renderHome()});
 if(state.query)searchSiteIndex(state.query);
}
async function searchSiteIndex(query){
 const area=$('#privateResults');if(!area)return;
 try{
  const response=await fetch('/api/search?q='+encodeURIComponent(query),{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Search service unavailable');
  const data=await response.json();
  if(data.schema!=='novalume.safe-search.v1'||!Array.isArray(data.results))throw Error('Invalid search response');
  if(!data.results.length){area.innerHTML='<div class="search-empty"><strong>No matching passages found.</strong><p>Try a character, location, or term from a hosted novel. A missing text match does not prove an event never happens.</p></div>';return}
  area.innerHTML=`<p class="search-result-count">${data.results.length} ${data.results.length===1?'book':'books'} with text overlap</p>`+
   data.results.map(r=>`<a class="semantic-result" href="#book/${escape(r.id)}"><strong>${escape(r.title)}</strong><span>${escape(r.matchStrength.replaceAll('-',' '))} · event meaning not verified</span><span>Open book →</span></a>`).join('');
 }catch{
  area.innerHTML='<div class="search-empty"><strong>Text search is temporarily unavailable.</strong><p>All available books remain readable below. You can still browse by title and genre.</p></div>';
 }
}
function bindCards(root=view){
 $$('[data-book]',root).forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('[data-save]'))return;window.location.hash=`#book/${el.dataset.book}`}));
 $$('[data-save]',root).forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();toggleFavorite(el.dataset.save)}));
}
function toggleFavorite(id){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save('favorites',state.favorites);toast(state.favorites.includes(id)?'Added to your library':'Removed from your library');route()}
function getBook(id){return [...state.catalog,...state.drafts].find(b=>b.id===id)}
function detail(id){
 const b=getBook(id);if(!b){window.location.hash='#home';return}
 const draft=b.id.startsWith('draft-');
 const liked=state.favorites.includes(id);
 const last=Math.max(1,Math.min(Number(state.progress[id])||1,b.chapterCount));
 const titles=b.chapterTitles||b.chapters?.map((ch,i)=>ch.title||`Section ${i+1}`)||[];
 const counts=b.chapterWordCounts||[];
 const source=b.sourceUrl?`<a href="${escape(b.sourceUrl)}" target="_blank" rel="noopener noreferrer">View source edition ↗</a>`:'';
 const scope=b.hostedScope==='sample';
 view.innerHTML=`<div class="detail-shell real-detail"><a href="#read-here" class="back-link">← Back to hosted books</a>
 <div class="detail-top"><div class="detail-cover">${bookCover(b,'large')}</div><div class="detail-copy">
  <div class="eyebrow small">${escape(b.genre)} · ${draft?'PRIVATE LOCAL DRAFT':'AVAILABLE TO READ'}</div>
  <h1>${escape(b.title)}</h1><p class="detail-by">by ${escape(b.author)}</p>
  <div class="detail-facts"><span>${b.chapterCount} ${b.chapterCount===1?'section':'sections'}</span>${b.wordCount?`<span>${b.wordCount.toLocaleString('en-AU')} words</span>`:''}${b.publicationYear?`<span>First published ${b.publicationYear}</span>`:''}</div>
  <p class="detail-blurb">${escape(b.blurb)}</p>
  ${scope?'<div class="edition-alert">Only the first chapter of this work is hosted here. This is a reading sample, not the complete book.</div>':''}
  <div class="detail-cta"><a class="btn primary" href="#read/${escape(id)}/${last}">${state.progress[id]?'Continue reading':'Start reading'} →</a><button class="btn secondary" id="favoriteDetail">${liked?'♥ Saved to library':'♡ Save to library'}</button></div>
  ${!draft?`<p class="source-note">Reviewed original-language edition · ${source}</p>`:'<p class="source-note">This draft is stored only in your browser. It has not been published or backed up.</p>'}
 </div></div>
 <div class="real-book-bottom"><section><div class="eyebrow small">ACTUAL SOURCE CONTENT</div><h2>Table of contents</h2><p class="muted">Jump to any section available in this edition. Your reading position stays on this device.</p>
  <ol class="actual-toc">${titles.map((title,i)=>`<li><a href="#read/${escape(id)}/${i+1}"><span class="toc-index">${String(i+1).padStart(2,'0')}</span><span class="toc-title">${escape(title)}</span>${counts[i]?`<span class="toc-words">${Math.max(1,Math.ceil(counts[i]/230))} min</span>`:''}<span aria-hidden="true">↗</span></a></li>`).join('')}</ol></section>
  <aside class="edition-aside"><h3>About the text</h3><p>${draft?'Unpublished browser draft':scope?'First-chapter sample':'Hosted rights-reviewed edition'}</p>${b.license?.edition?`<p class="muted">${escape(b.license.edition)}</p>`:''}${source}<p class="tiny-note">Only authorised source text is hosted; the edition information is separate from any automatic story interpretation.</p></aside>
 </div></div>`;
 $('#favoriteDetail').addEventListener('click',()=>toggleFavorite(b.id));
}
async function reader(id,n){
 const b=getBook(id),num=Number(n);
 if(!b||b.status!=='ready'||!Number.isInteger(num)||num<1||num>b.chapterCount){window.location.hash=`#book/${encodeURIComponent(id)}`;return}
 let data;
 if(Array.isArray(b.chapters))data={chapters:b.chapters};
 else {
  try{
   if(!state.bookCache.has(id)){
    const response=await fetch(`./data/books/${encodeURIComponent(id)}.json`);
    if(!response.ok)throw Error('Unable to load chapter text');
    const loaded=await response.json();
    if(!Array.isArray(loaded.chapters)||loaded.id!==id)throw Error('Invalid book file');
    state.bookCache.set(id,loaded);
   }
   data=state.bookCache.get(id);
  }catch{toast('Unable to load the book file.');window.location.hash=`#book/${escape(id)}`;return}
 }
 const chapter=data.chapters[num-1];if(!chapter){toast('Chapter not found');return}
 state.progress[id]=num;save('progress',state.progress);
 const names=b.chapterTitles||data.chapters.map((x,i)=>x.title||`Section ${i+1}`);
 const wordCount=b.chapterWordCounts?.[num-1]||0;
 view.innerHTML=`<div class="reader-shell real-reader"><div class="reader-top">
  <a class="reader-back" href="#book/${escape(id)}">← <span>Book details</span></a>
  <div class="reader-middle">${escape(b.title)} <span>·</span> ${num}/${b.chapterCount}</div>
  <div class="reader-tools"><button id="fontDown" aria-label="Decrease font size">A−</button><button id="fontUp" aria-label="Increase font size">A+</button></div>
  </div><div class="reader-progress" role="progressbar" aria-label="Progress by section" aria-valuemin="0" aria-valuemax="${b.chapterCount}" aria-valuenow="${num}"><div style="width:${Math.round(num/b.chapterCount*100)}%"></div></div>
  <div class="reader-jump"><label for="chapterJump">Section</label><select id="chapterJump" aria-label="Jump to section">${names.map((t,i)=>`<option value="${i+1}" ${num===i+1?'selected':''}>${i+1}. ${escape(t)}</option>`).join('')}</select><span>${wordCount?`${wordCount.toLocaleString('en-AU')} words · ~${Math.max(1,Math.ceil(wordCount/230))} min`:'Reading now'}</span></div>
  <article class="reading-page" style="--reading-size:${state.readerScale}px">
   <span class="chapter-kicker">SECTION ${num} OF ${b.chapterCount}</span>
   <h1>${escape(chapter.title||`Section ${num}`)}</h1><div class="chapter-ornament">✦</div>
   <div class="chapter-body">${(chapter.paragraphs||[]).map(p=>`<p>${escape(p)}</p>`).join('')}</div>
   <div class="chapter-end">✦</div>
   <div class="reader-ai-action"><a class="btn secondary" href="#assistant/${escape(id)}">Chapter-aware research desk</a></div>
   <div class="chapter-nav">${num>1?`<a href="#read/${escape(id)}/${num-1}">← Previous section</a>`:'<span></span>'}${num<b.chapterCount?`<a class="btn primary" href="#read/${escape(id)}/${num+1}">Next section →</a>`:`<a class="btn secondary" href="#book/${escape(id)}">Back to book →</a>`}</div>
  </article></div>`;
 $('#fontDown').onclick=()=>{state.readerScale=Math.max(15,state.readerScale-1);save('readerScale',state.readerScale);$('.reading-page').style.setProperty('--reading-size',`${state.readerScale}px`)};
 $('#fontUp').onclick=()=>{state.readerScale=Math.min(27,state.readerScale+1);save('readerScale',state.readerScale);$('.reading-page').style.setProperty('--reading-size',`${state.readerScale}px`)};
 $('#chapterJump').onchange=e=>{window.location.hash=`#read/${encodeURIComponent(id)}/${e.target.value}`};
}
function library(){
 const saved=state.favorites.map(getBook).filter(Boolean);
 const active=Object.keys(state.progress).map(getBook).filter(Boolean);
 view.innerHTML=`<section class="page-intro"><div class="eyebrow small">YOUR READING SHELF</div><h1>Your library<span class="accent-period">.</span></h1><p>Your reading progress and saved books are stored on this device. No account or cloud syncing yet.</p></section>
 <section class="content-wrap library-page"><div class="catalog-heading"><div><h2>Continue reading</h2><span class="results-note">Return to your last opened section</span></div></div>
 ${active.length?`<div class="library-continue-list">${active.map(b=>`<a href="#read/${escape(b.id)}/${Math.max(1,Math.min(Number(state.progress[b.id])||1,b.chapterCount))}"><span><strong>${escape(b.title)}</strong><small>Section ${state.progress[b.id]} / ${b.chapterCount}</small></span><span>Continue →</span></a>`).join('')}</div>`:`<div class="library-empty"><span>◇</span><h3>Start your first chapter</h3><p>Your next reading session will appear here automatically.</p><a class="btn primary" href="#read-here">Browse hosted books →</a></div>`}
 <div class="catalog-heading saved-heading"><div><h2>Saved books</h2><span class="results-note">${saved.length} on your shelf</span></div></div>
 ${saved.length?`<div class="book-grid compact-books real-book-grid">${saved.map(bookCard).join('')}</div>`:'<p class="muted">Save a book using the heart on its card or book page.</p>'}
 </section>`;bindCards();
}
function studio(){view.innerHTML=`<section class="studio-hero"><div class="eyebrow small">FOR THE WORLD-BUILDERS</div><h1>Your story deserves<br/><em>the right readers.</em></h1><p>Novalume is building a home where the narrative itself helps the right audience find you. Start a private local draft while public publishing infrastructure is being built.</p></section><section class="content-wrap studio-layout"><div class="studio-editor"><div class="section-overline">LOCAL DRAFT WORKSPACE · NOT PUBLICLY PUBLISHED</div><form id="draftForm"><label>Story title <input id="draftTitle" maxlength="100" required placeholder="The Kingdom Beyond the Veil"/></label><label>Your pen name <input id="draftAuthor" maxlength="60" required placeholder="A. Storyteller"/></label><label>Genre <select id="draftGenre"><option>Fantasy</option><option>Adventure</option><option>Mystery</option><option>Romance</option><option>Science Fiction</option><option>Literary</option></select></label><label>Premise <textarea id="draftBlurb" maxlength="600" placeholder="What makes this story worth reading?" required></textarea></label><label>First chapter <textarea id="draftChapter" minlength="100" rows="12" required placeholder="Write or paste your first chapter here. For now this stays in your browser only."></textarea></label><button class="btn primary" type="submit">Save private draft →</button><p class="form-disclaimer">Stored only in this browser. This is not a backup or a public submission. Export your manuscript separately.</p></form></div><aside class="studio-aside"><div class="eyebrow small">OUR PUBLISHING PROMISE</div><h2>Built around<br/>your independence.</h2>${['Non-exclusive publishing is the planned default','Author-controlled rights and AI-analysis permissions','Transparent audience-matching explanations','No automatic rewriting of your creative work','Clear source provenance and content policy'].map(s=>`<div class="promise"><span>✓</span>${s}</div>`).join('')}<div class="draft-section"><h3>Your private drafts</h3>${state.drafts.length?state.drafts.map(b=>`<div class="draft-item"><strong>${escape(b.title)}</strong><a href="#book/${escape(b.id)}">Open →</a></div>`).join(''):'<p>No drafts saved yet.</p>'}</div></aside></section>`;
 $('#draftForm').onsubmit=e=>{e.preventDefault();const title=$('#draftTitle').value.trim(),author=$('#draftAuthor').value.trim(),blurb=$('#draftBlurb').value.trim(),content=$('#draftChapter').value.trim();if(content.length<100){toast('Add at least 100 characters.');return};const b={id:'draft-'+Date.now(),title,author,blurb,genre:$('#draftGenre').value,tags:[$('#draftGenre').value.toLowerCase()],storySignals:['Author draft — metadata not yet analysed'],colors:['#59475e','#171a27'],mark:'✧',status:'ready',chapterCount:1,chapters:[{title:'Chapter 1',paragraphs:content.split(/\n\s*\n/).filter(Boolean)}],license:{type:'AUTHOR-OWNED',note:'Private draft on this device; not publicly published.'}};state.drafts.unshift(b);try{save('drafts',state.drafts)}catch{state.drafts.shift();toast('Browser storage is full. Save your chapter elsewhere.');return}toast('Private draft saved on this device');window.location.hash=`#book/${b.id}`};
}
function rights(){
 view.innerHTML=`<section class="page-intro"><div class="eyebrow small">SOURCE TRANSPARENCY</div><h1>Rights & sources<span class="accent-period">.</span></h1><p>Every listed book has an actual hosted text file backed by a reviewed source record.</p></section>
 <section class="content-wrap policy-page"><h2>What is in the library?</h2><p>Only editions with a completed rights review and readable chapter files appear in the public catalogue. Other titles are kept in an internal review queue and are not displayed as books you can read here.</p>
 <h2>Copyright and edition checks</h2><p>We check the original work, any translation or edition-specific contribution, and the intended publishing territories. Standard Ebooks releases its own editorial work under CC0 but does not guarantee public-domain status in every country. An approved import is not automatic permission for modern adaptations.</p>
 <h2>Reader data</h2><p>Saved books, chapter progress, display preferences and unpublished drafts are currently stored in your browser. We do not claim that you have an online account or that your data will sync to another device.</p>
 <h2>Publishing status</h2><p>Public author submissions, account authentication, payments and copyright complaint handling are not yet enabled. The writing workspace is local-only until secure publishing is ready.</p>
 <h2>Official references</h2><p><a href="https://standardebooks.org/about/standard-ebooks-and-the-public-domain" target="_blank" rel="noopener noreferrer">Standard Ebooks rights policy ↗</a></p><p><a href="https://www.ag.gov.au/rights-and-protections/copyright/copyright-basics" target="_blank" rel="noopener noreferrer">Australian copyright basics ↗</a></p></section>`;
}
function showTasteModal(){const old=$('#tasteOverlay');old?.remove();const options=['Fantasy','Mystery','Adventure','Romance','Hidden identity','Earned progression','Public reaction','Family conflict','Revenge','Political intrigue','Clever protagonist','Slow burn','Science fiction','Horror'];const overlay=document.createElement('div');overlay.id='tasteOverlay';overlay.className='modal-scrim';overlay.innerHTML=`<div class="taste-modal" role="dialog" aria-modal="true" aria-labelledby="modalHeading"><div class="modal-top"><div><div class="eyebrow small">MAKE IT PERSONAL</div><h2 id="modalHeading">What do you love in a story?</h2></div><button id="closeTaste" class="modal-close" aria-label="Close">×</button></div><p>Choose what makes you keep turning the page. Your preferences stay in this browser.</p><div class="taste-options">${options.map(p=>`<button class="taste-option ${state.preferred.includes(p)?'selected':''}" data-preference="${escape(p)}">${state.preferred.includes(p)?'✓ ':''}${escape(p)}</button>`).join('')}</div><label class="custom-taste-label" for="customTaste">Any other story features you love?</label><input id="customTaste" placeholder="e.g. slow-burn power reveal, sect politics, stubborn heroine"/><button class="btn primary" id="saveTaste">Find my stories →</button></div>`;document.body.appendChild(overlay);$('#closeTaste').onclick=()=>overlay.remove();overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});$$('[data-preference]',overlay).forEach(el=>el.onclick=()=>{let p=el.dataset.preference;state.preferred=state.preferred.includes(p)?state.preferred.filter(x=>x!==p):[...state.preferred,p];el.classList.toggle('selected');el.textContent=(state.preferred.includes(p)?'✓ ':'')+p});$('#saveTaste').onclick=()=>{const custom=$('#customTaste')?.value.trim();if(custom&&!state.preferred.includes(custom))state.preferred.push(custom.slice(0,120));save('preferred',state.preferred);overlay.remove();window.location.hash='#home';renderHome();toast('Your preferences are saved')};}
function profile(){showTasteModal()}
// The AI Desk works entirely offline except when a reader deliberately opts into their own LOCAL model.
async function loadKnowledge(bookId){
  if(!/^[a-z0-9-]+$/.test(bookId))throw new Error('Invalid book');
  if(state.knowledgeCache.has(bookId))return state.knowledgeCache.get(bookId);
  if(!state.storyIndex?.books?.[bookId])throw new Error('No reviewed evidence index exists for this book yet.');
  const r=await fetch(`./data/knowledge/${encodeURIComponent(bookId)}.json`);
  if(!r.ok)throw new Error('Evidence file could not be loaded.');
  const data=await r.json();
  if(data.bookId!==bookId)throw new Error('Story index mismatch');
  state.knowledgeCache.set(bookId,data);
  return data;
}
function downloadJson(name,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function aiDesk(){
 view.innerHTML=`<section class="content-wrap simple-ai"><div class="eyebrow small">ADVANCED STORY SEARCH</div><h1>Search our <em>hosted books.</em></h1><p>This experimental text engine currently searches only licensed chapters read directly on Novalume, not the external webnovel directory. External webnovels can be found on Discover by their source-listed themes.</p>
 <form id="aiSearchForm" class="ai-search-form"><label for="aiQuestion">Describe what you want</label><textarea id="aiQuestion" rows="4" placeholder="I want an intelligent protagonist whose family misunderstands them, with public reactions and earned progression. Avoid endless filler."></textarea><button class="btn primary" type="submit">Search novel text →</button></form>
 <div id="aiRecommendations" class="ai-results" role="status"><p class="muted">Your request can be as detailed as you like. Novalume uses text-derived clues rather than only genre tags.</p></div>
 <details class="assistant-connection"><summary>Connect your own AI assistant <span>▾</span></summary>
 <p>If your AI application supports custom MCP servers, add this read-only search tool. It returns safe book recommendations without giving the model the hidden chapter metadata. You do not provide Novalume with an API key.</p>
 <label for="aiMcpUrl">MCP endpoint</label><div class="copy-url"><input id="aiMcpUrl" readonly value="${escape(location.origin+'/api/mcp')}"/><button id="copyMcp">Copy</button></div>
 <button class="btn secondary" id="copyToolInstructions">Copy connection instructions</button>
 <p class="tiny-note">Early experimental MCP endpoint. Whether third-party assistants can connect depends on each application's supported tool connections. A precise match can itself imply a plot element you asked about; chapter spoilers and passages are never returned.</p>
 </details><p class="tiny-note">No paid AI is used for Novalume's text extraction or matching. Candidate matches are not proof that an event happens.</p></section>`;
 $('#aiSearchForm').onsubmit=async e=>{
   e.preventDefault();const q=$('#aiQuestion').value.trim(),box=$('#aiRecommendations');if(!q){toast('Describe the story you want first');return}
   box.innerHTML='<p class="muted">Searching the static narrative evidence…</p>';
   try{const r=await fetch('/api/search?q='+encodeURIComponent(q));const x=await r.json();
      if(!r.ok||x.schema!=='novalume.safe-search.v1')throw new Error('Unavailable');
      box.innerHTML=x.results?.length?x.results.map(item=>`<a href="#book/${escape(item.id)}" class="semantic-result"><strong>${escape(item.title)}</strong><span>${escape(item.publicBlurb)}</span><small>${escape(item.matchStrength.replaceAll('-',' '))} · Interpretation unverified</small><span>Open novel →</span></a>`).join(''):'<p class="muted">No supported matches yet. The index only covers rights-approved hosted chapters.</p>';
   }catch(e){box.innerHTML='<p class="muted">Text search is unavailable in this offline copy. Open the deployed Novalume site to use private indexing.</p>'}
 };
 $('#copyMcp').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+'/api/mcp');toast('MCP URL copied')}catch{toast('Use the URL field to copy manually')}};
 $('#copyToolInstructions').onclick=async()=>{const prompt=`Novalume offers a read-only MCP search tool at ${location.origin}/api/mcp. If you support remote MCP tools, connect and call search_novalume with a detailed query. It returns spoiler-safe candidate titles only; the private metadata cannot be browsed or downloaded. No API key should be shared with Novalume. If you cannot connect a remote MCP server, explain that limitation.`;
   try{await navigator.clipboard.writeText(prompt);toast('Instructions copied')}catch{toast('Clipboard access unavailable')}};
}
function updateNav(){const path=location.hash.slice(1).split('/')[0]||'home';const tab=['series'].includes(path)?'home':['book','read','library'].includes(path)?'read-here':path;$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===tab))}
async function route(){updateNav();const [path,arg,n]=(location.hash.slice(1)||'home').split('/');if(path==='home')mountDirectory(view,state.directory);else if(path==='series')mountSeries(view,state.directory,arg);else if(path==='tracking')mountTracking(view,state.directory);else if(path==='read-here')renderHome();else if(path==='library')library();else if(path==='studio')studio();else if(path==='book')detail(arg);else if(path==='read')await reader(arg,n||'1');else if(path==='rights')rights();else if(path==='assistant')await aiDesk(arg);else mountDirectory(view,state.directory);window.scrollTo({top:0,left:0,behavior:'instant'})}
function initTheme(){document.documentElement.dataset.theme=state.theme;$('#themeBtn').textContent=state.theme==='dark'?'☼':'☾';$('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';save('theme',state.theme);initTheme()}}
async function main(){initTheme();try{const [directoryResp,catalogResp,indexResp]=await Promise.all([fetch('./data/series_registry.json'),fetch('./data/catalog.json'),fetch('./data/story_index.json')]);if(!directoryResp.ok||!catalogResp.ok)throw new Error('Unable to load the sourced novel catalogue');state.directory=validateDirectory(await directoryResp.json());state.catalog=await catalogResp.json();state.storyIndex=indexResp.ok?await indexResp.json():{books:{}};await route()}catch(e){view.innerHTML=`<div class="fatal-error"><h2>Library temporarily unavailable</h2><p>${escape(e.message)}</p><p>Please reload this page to retry.</p></div>`}};
window.addEventListener('hashchange',route);main();
