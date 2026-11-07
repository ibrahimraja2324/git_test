/** Novalume real-user community.
 * No invented public ratings, profiles or reviews. Public content is backed by
 * Supabase Auth and SQL RLS; private diary is not automatically uploaded.
 */
import {communityConfig} from './community_config.js';
import {sanitizeShelf} from './directory.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validHandle=h=>/^[a-z][a-z0-9_]{2,23}$/.test(String(h||''));
const stars=()=>Array.from({length:10},(_,i)=>(i+1)/2).map(x=>'<option value="'+x+'">'+x.toFixed(1)+' ★</option>').join('');
let clientPromise;
export async function communityClient(){
 if(!clientPromise)clientPromise=import(/* @vite-ignore */ communityConfig.sdk).then(mod=>{
  if(!mod.createClient)throw Error('Social login SDK unavailable');
  return mod.createClient(communityConfig.url,communityConfig.publishableKey,{
   auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,
     storageKey:'novalume-community-session-v1'}
  });
 }).catch(e=>{clientPromise=null;throw e});
 return clientPromise;
}
export function reviewCard(r,handle,title,currentUserId){
 const name=handle||'Reader';
 const reviewText=esc(r.body);
 return '<article class="nov-community-review" data-review-id="'+esc(r.id)+'">'+
 '<div class="nov-community-review-header"><a href="#people/'+encodeURIComponent(name)+'">@'+esc(name)+'</a>'+
 '<span>'+Number(r.rating).toFixed(1)+' ★</span><small>'+esc(title||r.work_id)+'</small></div>'+
 (r.spoiler?'<details class="nov-review-spoiler"><summary>Contains spoilers — reveal review</summary><p>'+reviewText+'</p></details>':
 '<p>'+reviewText+'</p>')+
 '<div class="nov-review-foot"><span>'+esc(String(r.created_at||'').slice(0,10))+'</span>'+
 (currentUserId&&currentUserId!==r.user_id?'<button type="button" data-review-report="'+esc(r.id)+'">Report</button>':'')+
 '</div></article>';
}
export function cloudDiaryRows(snapshot,series,userId){
 const safe=sanitizeShelf(snapshot,series);
 if(!/^[0-9a-f-]{36}$/i.test(String(userId||'')))return [];
 return Object.entries(safe).slice(0,2000).map(([workId,x])=>({
  user_id:userId,work_id:workId,status:x.status,chapter:x.chapter,
  rating:x.rating||null,note:x.note,review:x.review||'',review_spoiler:x.reviewSpoiler===true,
  updated_at:new Date().toISOString()
 }));
}
function caption(text){return '<p class="nov-community-caption">'+esc(text)+'</p>';}
async function fetchReviews(db,series,workId='',userId=''){
 let query=db.from('novalume_reviews')
  .select('id,user_id,work_id,rating,body,spoiler,visible,created_at',{count:'exact'})
  .eq('visible',true).order('created_at',{ascending:false}).limit(24);
 if(workId)query=query.eq('work_id',workId);
 if(userId)query=query.eq('user_id',userId);
 const {data, count,error}=await query;
 if(error)throw error;
 const ids=[...new Set((data||[]).map(r=>r.user_id))];
 let names=new Map();
 if(ids.length){
  const lookup=await db.from('novalume_profiles').select('user_id,handle').in('user_id',ids);
  if(!lookup.error)names=new Map((lookup.data||[]).map(x=>[x.user_id,x.handle]));
 }
 const titles=new Map(series.map(x=>[x.id,x.title]));
 return {rows:data||[],count:count||0,names,titles};
}
function reviewsHtml(r,userId){
 return r.rows.length?r.rows.map(x=>reviewCard(x,r.names.get(x.user_id),r.titles.get(x.work_id),userId)).join(''):
 '<div class="nov-social-empty">No public reviews yet. Be among the first readers to add a genuine one.</div>';
}
function authPanel(){
 return '<section class="nov-community-auth"><h2>Join Novalume</h2>'+
 '<p>Create an account to publish real reviews, follow readers and back up your private diary. Reading and browsing remain free without signing in.</p>'+
 '<form id="novAuthForm"><label>Email<input id="novEmail" type="email" required autocomplete="email" placeholder="you@example.com"></label>'+
 '<label>Password<input id="novPassword" type="password" required minlength="8" autocomplete="current-password" placeholder="At least eight characters"></label>'+
 '<div class="nov-auth-actions"><button name="action" value="login" type="submit">Sign in</button>'+
 '<button name="action" value="signup" type="submit">Create account</button></div></form>'+
 '<p class="nov-community-caption">Email verification may be required. Account emails are handled by the connected authentication provider; we never display member emails publicly.</p></section>';
}
function createProfilePanel(user){
 return '<section class="nov-community-auth"><h2>Choose your reader identity</h2><p>Your public handle and display name are visible to other readers. Your email and private reading diary are not.</p>'+
 '<form id="novProfileForm"><label>Handle<input id="novHandle" maxlength="24" pattern="[a-z][a-z0-9_]{2,23}" required placeholder="reader_worlds"></label>'+
 '<label>Display name<input id="novDisplay" maxlength="70" required placeholder="What should readers call you?"></label>'+
 '<button type="submit">Create public profile</button></form>'+
 caption('Signed in as '+(user?.email||'verified account'))+'</section>';
}
function composer(series,target){
 return '<section class="nov-review-compose"><span class="nov-community-eyebrow">YOUR PUBLIC REVIEW</span><h2>What did you think?</h2>'+
 '<p>This is a separate, public post. Your private diary is never published automatically.</p>'+
 '<form id="novReviewForm"><label>Published title<select id="novReviewWork">'+
 series.map(s=>'<option value="'+esc(s.id)+'" '+(target===s.id?'selected':'')+'>'+esc(s.title)+'</option>').join('')+'</select></label>'+
 '<label>Your score<select id="novReviewRating">'+stars()+'</select></label>'+
 '<label>Review text<textarea id="novReviewBody" rows="5" minlength="30" maxlength="2000" required placeholder="Describe what made this webnovel worth reading…"></textarea></label>'+
 '<label class="nov-community-check"><input type="checkbox" id="novReviewSpoiler"> My review contains story spoilers</label>'+
 '<button type="submit">Publish my review</button><p class="nov-community-feedback" id="novReviewStatus" role="status"></p></form></section>';
}
function backupPanel(){
 return '<section class="nov-cloud-panel"><h2>Your private cloud diary</h2>'+
 '<p>Your on-device entries remain private and separate from public reviews. You decide when to upload or restore a backup.</p>'+
 '<div><button id="novUploadDiary" type="button">Back up this device →</button>'+
 '<button id="novRestoreDiary" type="button">Restore cloud diary →</button></div>'+
 '<p class="nov-community-feedback" id="novBackupStatus" role="status"></p></section>';
}
function profileHeader(profile){
 return '<div class="nov-social-signed"><span>Signed in as <a href="#people/'+esc(profile.handle)+'">@'+esc(profile.handle)+'</a></span>'+
 '<button id="novSignOut" type="button">Sign out</button></div>';
}
function communityBanner(target,series){
 const s=series.find(x=>x.id===target);
 return '<section class="nov-community-hero"><div class="content-wrap"><span class="nov-community-eyebrow">NOVALUME · A REAL READER COMMUNITY</span>'+
 '<h1>Every story starts <em>a conversation.</em></h1>'+
 '<p>Keep a reading diary, tell other readers what worked, find people with your taste, and link back to the original creators.</p>'+
 (s?'<div class="nov-selected-work">Discussing <a href="#series/'+esc(s.id)+'">'+esc(s.title)+' ↗</a></div>':'')+'</div></section>';
}
function feedSection(feed,target,userId){
 return '<section class="nov-public-feed"><div class="nov-community-feed-heading"><div><span class="nov-community-eyebrow">REAL COMMUNITY ACTIVITY</span>'+
 '<h2>'+(target?'Reviews for this novel':'What readers are saying')+'</h2>'+
 '<p>'+feed.count+' actual public '+(feed.count===1?'review':'reviews')+(feed.count>24?' · showing latest 24':'')+
 ' · No synthetic accounts or ratings</p></div>'+
 (target?'<a href="#community">All reviews →</a>':'')+'</div>'+
 '<div class="nov-review-grid">'+reviewsHtml(feed,userId)+'</div></section>';
}
function reportBind(root,db,user){
 root.querySelectorAll('[data-review-report]').forEach(btn=>btn.onclick=async()=>{
  if(!user){alert('Sign in to report a public review.');return}
  const reason=prompt('Report reason: spoiler-unmarked, spam, harassment, copyright, or other');
  if(!reason)return;
  if(!['spoiler-unmarked','spam','harassment','copyright','other'].includes(reason)){alert('Choose one of the listed reasons.');return}
  const {error}=await db.from('novalume_review_reports').upsert({
    reporter_id:user.id,review_id:btn.dataset.reviewReport,reason
   },{onConflict:'reporter_id,review_id'});
  if(error)alert('Could not submit report. Try again.');
  else{btn.textContent='Reported';btn.disabled=true;}
 });
}
function authBind(root,db,series,target){
 const form=root.querySelector('#novAuthForm');if(!form)return;
 form.onsubmit=async e=>{
  e.preventDefault();
  const button=e.submitter;
  const email=root.querySelector('#novEmail').value.trim(),password=root.querySelector('#novPassword').value;
  if(password.length<8)return alert('Choose a password with at least eight characters.');
  button.disabled=true;
  try{
   const result=button.value==='signup'
    ?await db.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}})
    :await db.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   if(button.value==='signup'&&!result.data.session){
    alert('Check your email to verify this account. If the confirmation link does not return to Novalume, the Supabase project needs its production redirect URL configured.');
   }else await renderCommunity(root,series,target);
  }catch(err){alert('Sign-in failed: '+String(err.message||'Please retry').slice(0,220))}
  finally{button.disabled=false}
 };
}
function profileBind(root,db,user,series,target){
 const form=root.querySelector('#novProfileForm');if(!form)return;
 form.onsubmit=async e=>{
  e.preventDefault();
  const handle=root.querySelector('#novHandle').value.toLowerCase().trim(),
   display=root.querySelector('#novDisplay').value.trim();
  if(!validHandle(handle)||!display||display.length>70)return alert('Choose a valid handle and display name.');
  const {error}=await db.from('novalume_profiles').insert({user_id:user.id,handle,display_name:display});
  if(error)alert(error.code==='23505'?'This handle is taken. Choose another.':String(error.message));
  else await renderCommunity(root,series,target);
 };
}
function composerBind(root,db,user,series,target){
 const form=root.querySelector('#novReviewForm');if(!form)return;
 form.onsubmit=async e=>{
  e.preventDefault();
  const workId=root.querySelector('#novReviewWork').value,
   rating=Number(root.querySelector('#novReviewRating').value),
   body=root.querySelector('#novReviewBody').value.trim(),
   spoiler=root.querySelector('#novReviewSpoiler').checked;
  const feedback=root.querySelector('#novReviewStatus');
  if(!series.some(x=>x.id===workId)||body.length<30||body.length>2000||rating*2!==Math.trunc(rating*2)||rating<.5||rating>5){
    feedback.textContent='Select a real novel, a half-star rating and a review of 30–2,000 characters.';return;
  }
  if(!confirm('Publish this review publicly? Your private diary will remain private.'))return;
  const {error}=await db.from('novalume_reviews').upsert({
   user_id:user.id,work_id:workId,rating,body,spoiler,visible:true,updated_at:new Date().toISOString()
  },{onConflict:'user_id,work_id'});
  if(error)feedback.textContent='Could not publish: '+error.message.slice(0,180);
  else await renderCommunity(root,series,workId);
 };
}
function backupBind(root,db,user,series){
 const upload=root.querySelector('#novUploadDiary'),download=root.querySelector('#novRestoreDiary');
 const feedback=root.querySelector('#novBackupStatus');
 if(upload)upload.onclick=async()=>{
  let local={};try{local=JSON.parse(localStorage.getItem('novalume:seriesShelfV1')||'{}')}catch{}
  const rows=cloudDiaryRows(local,series,user.id);
  if(!rows.length){feedback.textContent='No eligible entries on this device to back up.';return}
  if(!confirm('Back up '+rows.length+' local entries? This replaces cloud entries for the same novels, but does not make notes or chapters public.'))return;
  const {error}=await db.from('novalume_diary').upsert(rows,{onConflict:'user_id,work_id'});
  feedback.textContent=error?'Backup failed: '+error.message.slice(0,160):rows.length+' diary entries backed up privately.';
 };
 if(download)download.onclick=async()=>{
  const {data,error}=await db.from('novalume_diary')
   .select('work_id,status,chapter,rating,note,review,review_spoiler').eq('user_id',user.id).limit(2000);
  if(error){feedback.textContent='Could not read cloud diary: '+error.message;return}
  if(!data?.length){feedback.textContent='Cloud diary is empty.';return}
  if(!confirm('Restore '+data.length+' cloud entries? Existing entries on this device for those same novels will be replaced.'))return;
  let existing={};try{existing=JSON.parse(localStorage.getItem('novalume:seriesShelfV1')||'{}')}catch{}
  const safe=sanitizeShelf(existing,series);
  for(const r of data){safe[r.work_id]={status:r.status,chapter:r.chapter,rating:r.rating||0,note:r.note||'',
    review:r.review||'',reviewSpoiler:r.review_spoiler===true};}
  try{localStorage.setItem('novalume:seriesShelfV1',JSON.stringify(safe));
   feedback.textContent='Cloud diary restored. Open My profile to see the entries.';
  }catch{feedback.textContent='Local storage is unavailable; nothing was restored.'}
 };
}
export async function renderCommunity(root,series,target=''){
 root.innerHTML=communityBanner(target,series)+'<div class="content-wrap nov-community-body"><p class="nov-community-caption">Connecting to the real Novalume community…</p></div>';
 try{
  const db=await communityClient();
  const auth=await db.auth.getUser(),user=auth.data?.user||null;
  const profile=user?(await db.from('novalume_profiles').select('user_id,handle,display_name,bio').eq('user_id',user.id).maybeSingle()).data:null;
  const reviews=await fetchReviews(db,series,target);
  const members=await db.from('novalume_profiles').select('handle,display_name').order('created_at',{ascending:false}).limit(12);
  root.innerHTML=communityBanner(target,series)+'<div class="content-wrap nov-community-body">'+
   '<div class="nov-community-layout"><div class="nov-community-main">'+
    (profile?profileHeader(profile):'')+
    (user?(profile?composer(series,target):createProfilePanel(user)):authPanel())+
    (profile?backupPanel():'')+
   '</div><aside class="nov-community-side"><h3>Built on real activity</h3>'+
   '<p>There are no fake reader accounts, paid reviews, borrowed ratings or simulated discussions.</p>'+
   '<strong>'+reviews.count+'</strong><small>actual published reviews</small>'+
   '<a href="#tracking">Your private reading diary →</a>'+
   '<a href="#taste">Discover your taste →</a>'+
   '</aside></div>'+feedSection(reviews,target,user?.id||null)+'<section class="nov-reader-directory"><div class="nov-community-eyebrow">MEET REAL READERS</div><h2>New reader profiles</h2>'+
   (members.data?.length?'<div class="nov-reader-chips">'+members.data.map(m=>'<a href="#people/'+esc(m.handle)+'">'+esc(m.display_name)+' <small>@'+esc(m.handle)+'</small></a>').join('')+'</div>':
    '<p>No public reader profiles yet. The first verified members will appear here.</p>')+'</section></div>';
  authBind(root,db,series,target);
  if(user){profileBind(root,db,user,series,target);composerBind(root,db,user,series,target);}
  if(profile){
   root.querySelector('#novSignOut').onclick=async()=>{
    const result=await db.auth.signOut();
    if(result.error)alert('Sign out failed: '+result.error.message);
    else await renderCommunity(root,series,target);
   };
   backupBind(root,db,user,series);
  }
  reportBind(root,db,user);
 }catch(err){
  const region=root.querySelector('.nov-community-body');
  if(region)region.innerHTML='<section class="nov-social-empty"><h2>Community unavailable</h2><p>Unable to connect to the authentication or review database. Your on-device diary and all book links still work.</p><small>'+esc(String(err.message||'Connection failed').slice(0,200))+'</small></section>';
 }
}
export async function renderReaderProfile(root,series,handle){
 if(!validHandle(handle)){
  root.innerHTML='<section class="content-wrap nov-social-empty"><h2>Reader not found</h2><a href="#community">Explore community →</a></section>';return;
 }
 root.innerHTML='<section class="content-wrap nov-social-empty"><p>Opening reader profile…</p></section>';
 try{
  const db=await communityClient();
  const found=await db.from('novalume_profiles').select('user_id,handle,display_name,bio').eq('handle',handle).maybeSingle();
  if(found.error)throw found.error;
  const profile=found.data;
  if(!profile){root.innerHTML='<section class="content-wrap nov-social-empty"><h2>Reader not found</h2><a href="#community">Explore community →</a></section>';return}
  const auth=await db.auth.getUser(),user=auth.data?.user;
  const reviews=await fetchReviews(db,series,'',profile.user_id);
  const follows=await db.from('novalume_follows').select('follower_id',{count:'exact',head:true}).eq('followed_id',profile.user_id);
  let isFollowing=false;
  if(user&&user.id!==profile.user_id){
   const check=await db.from('novalume_follows').select('follower_id').eq('follower_id',user.id).eq('followed_id',profile.user_id).maybeSingle();
   isFollowing=Boolean(check.data);
  }
  root.innerHTML='<section class="nov-profile-hero"><div class="content-wrap"><span class="nov-community-eyebrow">NOVALUME READER</span>'+
   '<h1>'+esc(profile.display_name)+'</h1><p>@'+esc(profile.handle)+'</p><p>'+esc(profile.bio||'A reader discovering the next world.')+'</p>'+
   '<p>'+(follows.count||0)+' real followers · '+reviews.count+' published reviews</p>'+
   (user&&user.id!==profile.user_id?'<button type="button" id="novFollow">'+(isFollowing?'Following ✓':'Follow reader +')+'</button>':'')+
   '</div></section><div class="content-wrap nov-community-body">'+
   '<a class="nov-reader-back" href="#community">← All reader reviews</a>'+feedSection(reviews,'',user?.id||null)+'</div>';
  const follow=root.querySelector('#novFollow');
  if(follow)follow.onclick=async()=>{
   const result=isFollowing
    ?await db.from('novalume_follows').delete().eq('follower_id',user.id).eq('followed_id',profile.user_id)
    :await db.from('novalume_follows').insert({follower_id:user.id,followed_id:profile.user_id});
   if(result.error)alert('Could not follow: '+result.error.message);
   else await renderReaderProfile(root,series,handle);
  };
  reportBind(root,db,user);
 }catch{
  root.innerHTML='<section class="content-wrap nov-social-empty"><h2>Reader profile unavailable</h2><a href="#community">Explore community →</a></section>';
 }
}
