/** High-recall, spoiler-guarded retrieval over static evidence from approved books.
 * Evidence terms are NOT claims of confirmed narrative events, relationships or motives.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=path.join(ROOT,'server','private','static_observations');
const STOP=new Set('the a an and or of in on to for is are was were be been being has have had with as at by from they them their he she him her his its it my our you your me this these those that who what where which when why how will would can could must might should do does did not no without find want story stories book novel novels protagonist lead character happens happen then than after before about like someone something'.split(' '));
const ALIAS={
 shocked:['shock','surprise','surprised','astonished','fear','afraid','horror'],
 shockedpeople:['crowd','spectators','everyone','people'],
 surprise:['shocked','astonished','surprised'],
 secret:['hidden','concealed','disguise','deception'],
 power:['powers','strength','stronger','ability','skill','magic'],
 recognition:['reputation','known','famous','learned','discovered'],
 betrayed:['betrayed','betrayal','deceived','denied','rejected'],
 revenge:['revenge','avenged','vengeance'],
 underestimated:['weak','surprised','mistaken'],
 progress:['training','rank','level','power','stronger'],
 regret:['regret','ashamed','grief'],
 discovers:['discovered','found','revealed','learned'],
 marriage:['married','wife','husband'],
 vampire:['undead','vampires']
};
const words=s=>(String(s||'').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>2&&!STOP.has(w)).slice(0,80);
export function requestStaticArgs(raw={}){
 const query=typeof raw.query==='string'?raw.query.trim():'';
 if(query.length<3||query.length>250)throw Object.assign(new Error('Enter a 3–250 character story description.'),{status:400});
 const bookId=typeof raw.bookId==='string'?raw.bookId:'';
 if(bookId&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bookId))throw Object.assign(new Error('Invalid book identifier'),{status:400});
 const reveal=raw.reveal===true||raw.reveal==='true'||raw.reveal==='1';
 const limit=Number(raw.chapterLimit);
 if(reveal&&(!bookId||!Number.isInteger(limit)||limit<1||limit>3000))
    throw Object.assign(new Error('Specify one book and a permitted chapter cutoff before revealing evidence.'),{status:400});
 return {query,bookId,reveal,chapterLimit:reveal?limit:null};
}
function score(obs,query){
 const queryTerms=[...new Set(words(query))];
 if(!queryTerms.length)return 0;
 const observed=new Set([...(obs.terms||[]),...(obs.predicateCandidates||[]),
  ...(obs.rankingHints||[]).flatMap(words),(obs.entityMentions||[]).flatMap(words)]);
 let seen=0;
 for(const q of queryTerms){
  if(observed.has(q)){seen++;continue}
  if((ALIAS[q]||[]).some(t=>observed.has(t)))seen+=0.65;
 }
 if(!seen)return 0;
 return seen/queryTerms.length;
}
export function searchStaticEvidence(args,indices,{maxBooks=8,maxDetails=5}={}){
 const request=requestStaticArgs(args);
 const ranks=[];
 for(const [id,index] of Object.entries(indices||{})){
  if(request.bookId&&request.bookId!==id)continue;
  if(index.schema!=='novalume.private-static-observations.v1')continue;
  const candidates=(index.observations||[]).map(ob=>({ob,match:score(ob,request.query)}))
    .filter(({match})=>match>=.2).sort((a,b)=>b.match-a.match||a.ob.chapter-b.ob.chapter||a.ob.offset-b.ob.offset);
  if(!candidates.length)continue;
  const title=index.title||id.replaceAll('-',' ');
  ranks.push({id,title,index,candidates,score:candidates[0].match});
 }
 ranks.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
 return {
  schema:'novalume.static-evidence-search.v1',
  query:request.query,
  method:'Deterministic candidate matching in permitted chapter text. Not interpretation or verified plot fact.',
  revelation:request.reveal?'explicit-chapter-bounded':'title-only',
  results:ranks.slice(0,maxBooks).map(({id,title,candidates})=>{
   const head={bookId:id,title,bookUrl:'/#book/'+encodeURIComponent(id),
     matchType:'lexical-and-pattern-evidence-only',detailsHidden:!request.reveal};
   if(!request.reveal)return head;
   const visible=candidates.filter(x=>x.ob.chapter<=request.chapterLimit).slice(0,maxDetails);
   return {...head,detailsHidden:false,chapterLimit:request.chapterLimit,
     observations:visible.map(({ob})=>({
        chapter:ob.chapter,paragraph:ob.paragraph,
        evidencePreview:ob.evidencePreview,
        observationType:'unreviewed textual clue',
        uncertainty:ob.uncertainty,
        topicalHints:ob.rankingHints.slice(0,5),
        evidenceId:ob.id
     }))};
  })
 };
}
export function readStaticEvidence(bookId=''){
 const found={};
 if(bookId&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bookId))return found;
 const paths=bookId?[bookId+'.json']:(fs.existsSync(BASE)?fs.readdirSync(BASE).filter(x=>/^[a-z0-9-]+\.json$/.test(x)):[]);
 for(const name of paths){
  const abs=path.join(BASE,name);
  if(!fs.existsSync(abs))continue;
  const value=JSON.parse(fs.readFileSync(abs,'utf8'));
  if(value.schema==='novalume.private-static-observations.v1')found[value.bookId]=value;
 }
 return found;
}
