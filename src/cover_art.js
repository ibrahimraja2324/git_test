/** Provenance-validated Open Library book cover, browser-direct, no rehosting. */
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checkedDate=a=>typeof a?.sourceCheckedAt==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(a.sourceCheckedAt);
export function safeCoverArt(a){
 if(!a||a.provider!=='openlibrary'||a.mode!=='remote-display'||!checkedDate(a))return false;
 try{
  if(Number.isSafeInteger(a.coverId)&&a.coverId>0&&a.coverId<1e11){
   if(typeof a.workId!=='string'||!/^OL[0-9]{1,12}W$/.test(a.workId))return false;
   const u=new URL(a.workUrl);
   return u.protocol==='https:'&&u.hostname==='openlibrary.org'&&!u.username&&!u.password&&!u.port
    &&!u.search&&!u.hash&&u.pathname==='/works/'+a.workId;
  }
  if(typeof a.editionId!=='string'||!/^OL[0-9]{1,12}M$/.test(a.editionId))return false;
  const u=new URL(a.editionUrl);
  return u.protocol==='https:'&&u.hostname==='openlibrary.org'&&!u.username&&!u.password&&!u.port
   &&!u.search&&!u.hash&&u.pathname.startsWith('/books/'+a.editionId+'/')
   &&u.pathname.split('/').length===4;
 }catch{return false}
}
export function coverImg(series,size='M',eager=false){
 if(!safeCoverArt(series?.coverArt))return '';
 const art=series.coverArt;
 const key=Number.isSafeInteger(art.coverId)?'id/'+art.coverId:'olid/'+art.editionId;
 const base='https://covers.openlibrary.org/b/'+key;
 const large=size==='L'||size==='hero',primary=large?'L':'M';
 const src=base+'-'+primary+'.jpg?default=false';
 const srcset=large?'':(' srcset="'+base+'-M.jpg?default=false 1x, '+base+'-L.jpg?default=false 2x"');
 return '<img class="nov-external-cover" data-nov-cover="1" src="'+src+'"'+srcset+
 ' alt="Edition cover for '+escape(series.title)+'" decoding="async" loading="'+(eager?'eager':'lazy')+'"'+
 (eager?' fetchpriority="high"':'')+' referrerpolicy="no-referrer" width="300" height="450">';
}
export function bindCoverFallback(root){
 for(const img of root.querySelectorAll('img[data-nov-cover]')){
  const remove=()=>img.remove();
  img.addEventListener('error',remove,{once:true});
  img.addEventListener('load',()=>{if(img.naturalWidth<100||img.naturalHeight<120)remove()},{once:true});
  if(img.complete&&(img.naturalWidth===0||img.naturalWidth>0&&img.naturalWidth<100))remove();
 }
}
