/** Discoverable, clearly labelled unverified source leads; not canonical novels. */
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=null;
const view={q:'',category:'All',page:1};
export function queryLeads(items,{q='',category='All'}={}){
 const words=q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return items.filter(x=>(category==='All'||x.categoryHint===category)&&
 words.every(t=>(x.title+' '+x.author+' '+x.categoryHint).toLocaleLowerCase().includes(t)));
}
export function sliceLeads(items,page=1,size=24){
 const pages=Math.max(1,Math.ceil(items.length/size)),safe=Math.min(Math.max(1,page),pages);
 return {page:safe,pages,items:items.slice((safe-1)*size,safe*size),total:items.length};
}
export async function mountLeads(root){
 if(!data){
  const response=await fetch('./data/candidate_index.json');
  if(!response.ok){root.innerHTML='<section class="nov-leads"><h1>Research index unavailable</h1><p>This deployment does not yet contain the provisional dataset. The verified source-linked catalogue remains available.</p><a href="#home">Back to verified novels</a></section>';return}
  const v=await response.json();
  if(v.schema!=='novalume.unverified-title-leads.v1'||!Array.isArray(v.leads))throw Error('Invalid research index');
  data=v;
 }
 const draw=()=>{
  const filtered=queryLeads(data.leads,view),p=sliceLeads(filtered,view.page);view.page=p.page;
  const genres=[...new Set(data.leads.map(x=>x.categoryHint))].sort((a,b)=>a.localeCompare(b));
  root.innerHTML='<section class="nov-leads"><a href="#home">← Verified novels</a>'+
   '<h1>Unverified title leads</h1><p>Explore '+data.leads.length.toLocaleString()+' candidate Chinese titles from an openly claimed CC0 dataset. These are <strong>NOT confirmed original novels</strong>: authors, work identities and official reading links remain unverified.</p>'+
   '<div class="nov-lead-warning"><strong>Research-only directory.</strong> No copyrighted chapters, scraped descriptions, ratings or original covers. Some entries may be wrong, duplicates or non-novels. Do not add these to reading lists as verified books. <a href="'+escape(data.source)+'" target="_blank" rel="noopener noreferrer">Dataset source</a>.</div>'+
   '<form id="leadForm"><input id="leadQ" type="search" maxlength="160" value="'+escape(view.q)+'" placeholder="Chinese title, reported author or category" aria-label="Search candidate titles"/>'+
   '<select id="leadCat" aria-label="Filter reported category"><option>All</option>'+genres.map(g=>'<option '+(view.category===g?'selected':'')+'>'+escape(g)+'</option>').join('')+'</select><button type="submit">Search</button></form>'+
   '<p>'+p.total.toLocaleString()+' matches · Page '+p.page+' / '+p.pages+'</p>'+
   '<div class="nov-lead-grid">'+p.items.map(x=>'<article class="nov-lead-card"><small>UNVERIFIED DATASET LEAD</small><h3>'+escape(x.title)+'</h3><p>Reported author: '+escape(x.author)+'</p><p>Category hint: '+escape(x.categoryHint)+'</p><a href="#community">Suggest a verified source →</a></article>').join('')+'</div>'+
   '<div class="nov-lead-pager"><button id="leadPrev" '+(p.page===1?'disabled':'')+'>Previous</button><span>'+p.page+' of '+p.pages+'</span><button id="leadNext" '+(p.page===p.pages?'disabled':'')+'>Next</button></div></section>';
  root.querySelector('#leadForm').onsubmit=e=>{e.preventDefault();view.q=root.querySelector('#leadQ').value.trim().slice(0,160);view.category=root.querySelector('#leadCat').value;view.page=1;draw()};
  root.querySelector('#leadCat').onchange=()=>root.querySelector('#leadForm').requestSubmit();
  root.querySelector('#leadPrev').onclick=()=>{view.page=Math.max(1,view.page-1);draw()};
  root.querySelector('#leadNext').onclick=()=>{view.page=Math.min(p.pages,view.page+1);draw()};
 };draw();
}
