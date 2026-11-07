/** Reader-derived expectation/outcome evidence, not claimed novel plot facts.
 * Locally private by default. Cloud upload is an explicit user action elsewhere.
 */
export const EXPECTATIONS=Object.freeze([
 {id:'public_recognition',label:'Reputation that changes publicly',detail:'Other characters discover what the lead accomplished'},
 {id:'visible_reactions',label:'Reactions from people watching',detail:'The world responds visibly to a major action'},
 {id:'measurable_growth',label:'Clear, measurable power growth',detail:'Progress follows an understandable structure'},
 {id:'earned_power',label:'Power that feels earned',detail:'Strength comes from decisions, effort and costs'},
 {id:'long_term_payoff',label:'Long-term setup and payoff',detail:'Earlier choices matter many chapters later'},
 {id:'smart_protagonist',label:'Clever, consequential choices',detail:'The lead solves problems through believable decisions'},
 {id:'social_reversal',label:'Misunderstanding or status reversal',detail:'People reassess someone after learning the truth'},
 {id:'relationship_tension',label:'Specific relationship tension',detail:'Relationships produce meaningful plot consequences'},
 {id:'fast_pacing',label:'Little filler or wasted dialogue',detail:'Scenes move the plot or character forward'},
 {id:'world_consequence',label:'A world that remembers actions',detail:'Events change institutions, alliances and stakes'}
]);
const VALID=new Set(EXPECTATIONS.map(x=>x.id));
const KEY='novalume:experience:v1';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STATUSES=new Set(['reading','completed','stopped','unspecified']);
const cleanKeys=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&VALID.has(x)))].slice(0,10):[];
export function cleanExperience(row){
 if(!row||typeof row!=='object'||Array.isArray(row))return null;
 const wanted=cleanKeys(row.wanted),delivered=cleanKeys(row.delivered),missing=cleanKeys(row.missing);
 const missed=new Set(missing);
 const good=delivered.filter(x=>!missed.has(x));
 const outcome=STATUSES.has(row.outcome)?row.outcome:'unspecified';
 const n=Number(row.chapter);
 const chapter=Number.isSafeInteger(n)&&n>=0&&n<=1000000?n:0;
 const note=String(row.note??'').replace(/[\x00-\x08\x0b-\x1f\x7f]/g,' ').trim().slice(0,280);
 if(!wanted.length&&!good.length&&!missing.length&&!note&&outcome==='unspecified')return null;
 return {wanted,delivered:good,missing,outcome,chapter,note};
}
export function cleanLedger(data,series){
 const ids=new Set(series.map(x=>x.id));
 const out=Object.create(null);
 if(!data||typeof data!=='object'||Array.isArray(data))return out;
 for(const [id,row] of Object.entries(data)){
  if(!ids.has(id))continue;
  const v=cleanExperience(row);
  if(v)out[id]=v;
 }
 return out;
}
export function readLedger(series){
 try{return cleanLedger(JSON.parse(localStorage.getItem(KEY)),series)}
 catch{return Object.create(null)}
}
export function writeLedger(series,workId,record){
 const allowed=series.some(s=>s.id===workId);
 if(!allowed)throw Error('Unverified title is not eligible for a reader experience record');
 const ledger=readLedger(series),clean=cleanExperience(record);
 if(clean)ledger[workId]=clean;else delete ledger[workId];
 localStorage.setItem(KEY,JSON.stringify(ledger));
 return ledger;
}
export function experienceStats(series,ledger){
 const labels=new Map(EXPECTATIONS.map(d=>[d.id,{...d,wanted:0,delivered:0,missing:0}]));
 const records=[];
 for(const s of series){
  const r=cleanExperience(ledger[s.id]);
  if(!r)continue;
  records.push({id:s.id,title:s.title,...r});
  for(const id of r.wanted)labels.get(id).wanted++;
  for(const id of r.delivered)labels.get(id).delivered++;
  for(const id of r.missing)labels.get(id).missing++;
 }
 return {recordCount:records.length,dimensions:[...labels.values()].filter(x=>x.wanted+x.delivered+x.missing>0)
  .sort((a,b)=>(b.wanted+b.delivered+b.missing)-(a.wanted+a.delivered+a.missing)),records};
}
export function renderExperiencePanel(series,workId){
 const item=series.find(x=>x.id===workId);
 if(!item)return '';
 const current=readLedger(series)[workId]||{wanted:[],delivered:[],missing:[],outcome:'unspecified',chapter:0,note:''};
 return '<section class="nov-exp" id="novExperience"><div class="nov-kicker">YOUR EXPERIENCE · PRIVATE ON THIS DEVICE</div>'+
 '<h2>Did this story deliver what you wanted?</h2>'+
 '<p>Tell your reading diary what actually mattered. These are your own impressions, <strong>not independently verified facts about the novel</strong>. No feedback is uploaded automatically.</p>'+
 '<form id="novExpForm"><div class="nov-exp-questions">'+EXPECTATIONS.map(d=>'<div class="nov-exp-item">'+
 '<div><strong>'+escape(d.label)+'</strong><small>'+escape(d.detail)+'</small></div>'+
 '<label class="nov-exp-want"><input type="checkbox" data-exp-want="'+d.id+'" '+(current.wanted.includes(d.id)?'checked':'')+'> Wanted</label>'+
 '<select data-exp-outcome="'+d.id+'" aria-label="Did '+escape(d.label)+' work?">'+
 '<option value="">Not judged</option><option value="delivered" '+(current.delivered.includes(d.id)?'selected':'')+'>Delivered</option>'+
 '<option value="missing" '+(current.missing.includes(d.id)?'selected':'')+'>Missing / weak</option></select></div>').join('')+'</div>'+
 '<div class="nov-exp-fields"><label>Where you got to <input type="number" id="novExpChapter" inputmode="numeric" min="0" max="1000000" value="'+current.chapter+'"></label>'+
 '<label>Reading outcome <select id="novExpStatus">'+[['unspecified','Not recorded'],['reading','Still reading'],['completed','Finished'],['stopped','Stopped reading']].map(([v,t])=>'<option value="'+v+'" '+(v===current.outcome?'selected':'')+'>'+t+'</option>').join('')+'</select></label></div>'+
 '<label class="nov-exp-note">What specifically succeeded or failed? (optional, private)<textarea id="novExpNote" maxlength="280" rows="3" placeholder="A concrete example matters more than a vague tag.">'+escape(current.note)+'</textarea></label>'+
 '<div class="nov-exp-actions"><button type="submit">Save my experience</button><button type="button" id="novExpDelete">Delete this entry</button><a href="#taste">My reading fingerprint →</a></div>'+
 '<p id="novExpMessage" role="status" aria-live="polite"></p></form></section>';
}
export function bindExperiencePanel(root,series,workId){
 const form=root.querySelector('#novExpForm');
 if(!form)return;
 const message=root.querySelector('#novExpMessage');
 const save=ev=>{
  ev.preventDefault();
  const wanted=EXPECTATIONS.filter(d=>form.querySelector('[data-exp-want="'+d.id+'"]').checked).map(d=>d.id);
  const delivered=EXPECTATIONS.filter(d=>form.querySelector('[data-exp-outcome="'+d.id+'"]').value==='delivered').map(d=>d.id);
  const missing=EXPECTATIONS.filter(d=>form.querySelector('[data-exp-outcome="'+d.id+'"]').value==='missing').map(d=>d.id);
  try{
   writeLedger(series,workId,{wanted,delivered,missing,outcome:form.querySelector('#novExpStatus').value,
     chapter:form.querySelector('#novExpChapter').value,note:form.querySelector('#novExpNote').value});
   message.textContent='Saved privately on this device. Nothing was sent to Novalume.';
  }catch{message.textContent='Could not save locally. Check browser storage permissions.'}
 };
 form.addEventListener('submit',save);
 form.querySelector('#novExpDelete').onclick=()=>{
  if(!confirm('Delete your experience notes for this novel from this device?'))return;
  try{
   writeLedger(series,workId,null);
   const panel=root.querySelector('#novExperience');panel.outerHTML=renderExperiencePanel(series,workId);
   bindExperiencePanel(root,series,workId);
  }catch{message.textContent='Could not clear this entry.'}
 };
}
export function renderExperienceSummary(series){
 const x=experienceStats(series,readLedger(series));
 return '<section class="nov-exp-summary"><div class="nov-kicker">FIRST-PARTY READER UNDERSTANDING</div>'+
 '<h2>The story qualities you actually notice</h2>'+
 '<p>'+x.recordCount+' personal novel experience'+(x.recordCount===1?'':'s')+' recorded. Unlike generic genre tags, this tracks what you wanted and what felt satisfying or disappointing. These are your impressions—not validated narrative facts.</p>'+
 (x.dimensions.length?'<div class="nov-exp-summary-grid">'+x.dimensions.map(d=>'<article><strong>'+escape(d.label)+'</strong>'+
 '<span>Wanted '+d.wanted+' · Delivered '+d.delivered+' · Missing '+d.missing+'</span></article>').join('')+'</div>':
 '<p>Open a novel you know and record what you expected, what delivered and what fell short. Your fingerprint will appear here.</p>')+
 (x.records.length?'<div class="nov-exp-records"><h3>Your recorded stories</h3>'+x.records.map(r=>'<a href="#series/'+escape(r.id)+'">'+escape(r.title)+'</a>').join('')+'</div>':'')+
 '<div class="nov-exp-actions"><button id="novExpExport">Export my experience JSON</button><button id="novExpClearAll">Delete all local experience data</button><button id="novExpCloud">Back up privately (opt-in)</button><button id="novExpCloudDelete">Delete private backup</button></div>'+
 '<div class="nov-exp-contribute"><h3>Help improve discovery for other readers</h3>'+
 '<p>Contribute only the traits you wanted and judged, whether they delivered, your reading outcome and a broad chapter range. Your account ID is retained privately to prevent duplicates and allow withdrawal. <strong>Your written notes, exact chapter and public profile are never included.</strong> Nothing is shared without pressing the contribution button.</p>'+
 '<div class="nov-exp-actions"><button type="button" id="novExpContribute">Contribute judged outcomes (opt-in)</button>'+
 '<button type="button" id="novExpWithdraw">Withdraw my contributions</button></div>'+
 '<p id="novExpContributionMessage" role="status" aria-live="polite"></p></div>'+
 '<p id="novExpSummaryMessage" role="status" aria-live="polite"></p>'+
 '<p class="nov-exp-privacy">Only the explicit backup button sends this information to your authenticated account. Cloud backups remain private to you, not visible to other readers and not added to public reviews. No aggregated analytics are enabled.</p></section>';
}
export function experienceCloudRows(series,ledger,userId){
 if(typeof userId!=='string'||!/^[a-f0-9-]{36}$/i.test(userId))return [];
 return Object.entries(cleanLedger(ledger,series)).slice(0,2000).map(([workId,r])=>({
  user_id:userId,work_id:workId,reading_outcome:r.outcome,
  wanted:r.wanted,delivered:r.delivered,missing:r.missing,
  chapter:r.chapter,private_note:r.note
 }));
}

/** Deliberate donation of *codes only*, never private notes, exact chapters or identifiers in URLs. */
const CONSENT_VERSION='novalume-research-v1-2026-11';
export function contributionRows(series,ledger,userId,now=''){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(userId||'')))return [];
 const iso=typeof now==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(now)?now:new Date().toISOString();
 const safe=cleanLedger(ledger,series);
 const band=n=>n<=0?'unknown':n<20?'1-19':n<100?'20-99':n<500?'100-499':'500+';
 const rows=[];
 for(const item of series){
  const r=safe[item.id];
  if(!r)continue;
  const delivered=r.delivered.filter(t=>r.wanted.includes(t)),missing=r.missing.filter(t=>r.wanted.includes(t));
  if(!r.wanted.length||!delivered.length&&!missing.length)continue;
  rows.push({user_id:userId,work_id:item.id,wanted:r.wanted,delivered,missing,
   reading_outcome:r.outcome,chapter_band:band(r.chapter),
   consent_version:CONSENT_VERSION,consented_at:iso});
  if(rows.length>=2000)break;
 }
 return rows;
}

export function decodeCloudRows(rows,series){
 const allowed=new Set(series.map(x=>x.id)),out=Object.create(null);
 for(const r of (Array.isArray(rows)?rows:[]).slice(0,2000)){
  if(!allowed.has(r.work_id))continue;
  const entry=cleanExperience({wanted:r.wanted,delivered:r.delivered,missing:r.missing,
   outcome:r.reading_outcome,chapter:r.chapter,note:r.private_note});
  if(entry)out[r.work_id]=entry;
 }
 return out;
}
export function bindExperienceSummary(root,series,connect){
 const find=selector=>root.querySelector(selector);
 const status=message=>{const e=find('#novExpSummaryMessage');if(e)e.textContent=message};
 const download=()=>{
  const json=JSON.stringify({schema:'novalume.experience.v1',records:readLedger(series)},null,2);
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='novalume-my-reading-experience.json';a.click();URL.revokeObjectURL(url);
 };
 find('#novExpExport')?.addEventListener('click',download);
 find('#novExpClearAll')?.addEventListener('click',()=>{
  if(!confirm('Permanently remove all experience data saved on this device? This does not delete any cloud backup.'))return;
  localStorage.removeItem(KEY);status('Deleted from this device. Reloading the fingerprint.');
  const anchor=find('.nov-exp-summary');
  if(anchor){anchor.outerHTML=renderExperienceSummary(series);bindExperienceSummary(root,series,connect)}
 });
 const authenticated=async()=>{
  const db=await connect();
  const {data,error}=await db.auth.getUser();
  if(error||!data?.user?.id)throw Error('Sign in from Community before syncing. Your device data remains private.');
  return {db,user:data.user};
 };
 find('#novExpCloud')?.addEventListener('click',async()=>{
  try{
   const {db,user}=await authenticated();
   const rows=experienceCloudRows(series,readLedger(series),user.id);
   if(!rows.length){status('Record your experience with at least one novel before backing it up.');return}
   if(!confirm('Privately back up '+rows.length+' experience record(s) to your Novalume account? This does not publish your notes or ratings.'))return;
   const {error}=await db.from('novalume_reader_experience').upsert(rows,{onConflict:'user_id,work_id'});
   if(error)throw error;
   status('Saved '+rows.length+' private experience record(s) to your account.');
  }catch(e){status('Backup unavailable: '+String(e.message||e).slice(0,150))}
 });
 const contributeStatus=message=>{
  const el=find('#novExpContributionMessage');if(el)el.textContent=message;
 };
 find('#novExpContribute')?.addEventListener('click',async()=>{
  try{
   const {db,user}=await authenticated();
   const rows=contributionRows(series,readLedger(series),user.id);
   if(!rows.length){
    contributeStatus('Nothing eligible to contribute yet. Record a wanted quality and whether it delivered or disappointed on a novel page.');
    return;
   }
   if(!confirm('Opt in to contributing '+rows.length+' story-experience record(s)? We retain your account ID internally for deduplication and withdrawal. We store wanted/delivered/missing labels, reading outcome and broad chapter range. No notes, precise chapters, profile or emails are sent in this contribution. Data may inform future aggregate recommendation research. You can withdraw your contributions at any time.'))return;
   let saved=0;
   for(let i=0;i<rows.length;i+=50){
    const {error}=await db.from('novalume_consented_outcomes').upsert(rows.slice(i,i+50),{onConflict:'user_id,work_id'});
    if(error)throw Error('Only '+saved+' of '+rows.length+' records saved. '+error.message);
    saved+=Math.min(50,rows.length-i);
   }
   contributeStatus('Contributed '+saved+' opt-in record(s) privately for future research. Nothing is publicly displayed. Previous contributions not included in this action remain until you withdraw them.');
  }catch(e){contributeStatus('Contribution unavailable: '+String(e.message||e).slice(0,180))}
 });
 find('#novExpWithdraw')?.addEventListener('click',async()=>{
  try{
   const {db,user}=await authenticated();
   if(!confirm('Withdraw ALL of your opted-in Novalume story-experience contributions? Your private reading diary and personal backups will remain untouched.'))return;
   const {error}=await db.from('novalume_consented_outcomes').delete().eq('user_id',user.id);
   if(error)throw error;
   const verify=await db.from('novalume_consented_outcomes').select('work_id',{count:'exact',head:true}).eq('user_id',user.id);
   if(verify.error)throw verify.error;
   contributeStatus(verify.count===0?'All your opted-in research contributions were withdrawn.':'Withdrawal could not be fully confirmed; please retry.');
  }catch(e){contributeStatus('Withdrawal unavailable: '+String(e.message||e).slice(0,180))}
 });
 find('#novExpCloudDelete')?.addEventListener('click',async()=>{
  try{
   const {db,user}=await authenticated();
   if(!confirm('Delete ALL Novalume experience records in your cloud account? Local entries on this device will remain.'))return;
   const {error}=await db.from('novalume_reader_experience').delete().eq('user_id',user.id);
   if(error)throw error;
   status('Deleted your private experience backup from the account.');
  }catch(e){status('Cloud deletion unavailable: '+String(e.message||e).slice(0,150))}
 });
}
