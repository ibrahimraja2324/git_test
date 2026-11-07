/** Exact Open Library edition covers only, never scrape or proxy publisher art. */
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeCoverArt(a){
 if(!a||a.provider!=='openlibrary'||a.mode!=='remote-display')return false;
 if(typeof a.editionId!=='string'||!/^OL[0-9]{1,12}M$/.test(a.editionId))return false;
 try{
  const u=new URL(a.editionUrl);
  return u.protocol==='https:'&&u.hostname==='openlibrary.org'&&!u.username&&!u.password
   &&!u.port&&!u.search&&!u.hash&&u.pathname.startsWith('/books/'+a.editionId+'/')
   &&u.pathname.split('/').length===4;
 }catch{return false}
}
export function coverImg(series,size='S',eager=false){
 if(!safeCoverArt(series?.coverArt))return '';
 const id=series.coverArt.editionId;
 const sizeSafe=size==='M'?'M':'S';
 return '<img class="nov-external-cover" data-nov-cover="1" src="https://covers.openlibrary.org/b/olid/'+id+'-'+sizeSafe+'.jpg?default=false"'+
 ' alt="Book edition cover: '+escape(series.title)+'" decoding="async" loading="'+(eager?'eager':'lazy')+'"'+
 (eager?' fetchpriority="high"':'')+' width="180" height="270">';
}
export function bindCoverFallback(root){
 for(const img of root.querySelectorAll('img[data-nov-cover]')){
  const remove=()=>img.remove();
  img.addEventListener('error',remove,{once:true});
  if(img.complete&&img.naturalWidth===0)remove();
 }
}
