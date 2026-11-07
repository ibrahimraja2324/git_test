/** Browser-direct Open Library cover display; no local cover hosting or publisher scraping.
 * M for tiles, L for prominent art; never upscale S (tiny thumbnails).
 */
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeCoverArt(a){
 if(!a||a.provider!=='openlibrary'||a.mode!=='remote-display')return false;
 if(typeof a.editionId!=='string'||!/^OL[0-9]{1,12}M$/.test(a.editionId))return false;
 if(typeof a.sourceCheckedAt!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(a.sourceCheckedAt))return false;
 try {
  const u=new URL(a.editionUrl);
  return u.protocol==='https:'&&u.hostname==='openlibrary.org'&&!u.username&&!u.password&&!u.port
   &&!u.search&&!u.hash&&u.pathname.startsWith('/books/'+a.editionId+'/')
   &&u.pathname.split('/').length===4;
 }catch{return false}
}
export function coverImg(series,size='M',eager=false){
 if(!safeCoverArt(series?.coverArt))return '';
 const id=series.coverArt.editionId;
 const large=size==='L'||size==='hero', primary=large?'L':'M';
 const base='https://covers.openlibrary.org/b/olid/'+id;
 const src=base+'-'+primary+'.jpg?default=false';
 const set=large?'':(' srcset="'+base+'-M.jpg?default=false 1x, '+base+'-L.jpg?default=false 2x"');
 return '<img class="nov-external-cover" data-nov-cover="1" src="'+src+'"'+set+
 ' alt="Edition cover for '+escape(series.title)+'" decoding="async" loading="'+(eager?'eager':'lazy')+'"'+
 (eager?' fetchpriority="high"':'')+' referrerpolicy="no-referrer" width="300" height="450">';
}
export function bindCoverFallback(root){
 for(const img of root.querySelectorAll('img[data-nov-cover]')){
  const remove=()=>img.remove();
  img.addEventListener('error',remove,{once:true});
  // Some backends send tiny default art with HTTP 200; never upscale 1px placeholders.
  img.addEventListener('load',()=>{if(img.naturalWidth<100||img.naturalHeight<120)remove()},{once:true});
  if(img.complete&&(img.naturalWidth===0||img.naturalWidth>0&&img.naturalWidth<100))remove();
 }
}
