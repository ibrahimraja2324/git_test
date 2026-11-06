/** Spoiler-conscious narrative search over authorised, source-anchored editorial events.
 * This is not AI training, an external-site crawler or a factual-entailment model.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DATA=path.join(ROOT,'server','private','reviewed_events.json');
const STOP=new Set('a an and are as at be been book by did do does for from had has have he her him his i in into is it its me my novel of on or our she story stories that the their them there these they this those to was were what when where which who why will with would you your want find looking something about like how someone whose then later everyone'.split(' '));
const SYNONYMS=new Map([
 ['shocked',['shock','reaction','fear']],['shock',['reaction','fear']],
 ['scared',['fear','reaction']],['horrified',['horror','reaction']],
 ['reveal',['revelation','hidden','discovery']],['revealed',['revelation','hidden','discovery']],
 ['power',['ability','supernatural','magic']],['powers',['ability','supernatural','magic']],
 ['betrayal',['rejection','deception']],['abandon',['rejection','leaves']],
 ['abandoned',['rejection','leaves']],['disguise',['identity','deception']],
 ['secret',['hidden','deception']],['wealthy',['wealth','marriage']],
 ['rich',['wealth','marriage']],['mother',['family','bennet']],
 ['marry',['marriage']],['creation',['creates','creation','experiment']],
 ['inventor',['creation','experiment','science']]
]);
const tokens=s=>(String(s||'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(x=>x.length>2&&!STOP.has(x)).slice(0,60);
export function requestArgs(obj={}){
 const query=typeof obj.query==='string'?obj.query.trim():'';
 if(query.length<3||query.length>250)throw Object.assign(new Error('Enter a 3-250 character story description.'),{status:400});
 const bookId=typeof obj.bookId==='string'?obj.bookId:'';
 if(bookId&&!/^[a-z0-9-]{3,80}$/.test(bookId))throw Object.assign(new Error('Invalid book.'),{status:400});
 const reveal=obj.reveal===true||obj.reveal==='true'||obj.reveal==='1';
 const chapterLimit=Number(obj.chapterLimit);
 if(reveal&&(!bookId||!Number.isInteger(chapterLimit)||chapterLimit<1||chapterLimit>3000))
   throw Object.assign(new Error('Revealing details requires an explicit book and chapter cutoff.'),{status:400});
 return {query,bookId,reveal,chapterLimit:reveal?chapterLimit:null};
}
function eventScore(event,q){
 const words=new Set(tokens([event.summary,event.relation.actor,event.relation.predicate,
   event.relation.object,event.relation.type,...event.topics].join(' ')));
 const query=new Set(tokens(q));
 const count=[...query].filter(w=>words.has(w)||(SYNONYMS.get(w)||[]).some(v=>words.has(v))).length;
 return count/query.size||0;
}
export function searchEventIndex(args,index,{limit=8}={}){
 if(index?.schema!=='novalume.private-narrative-events.v1')throw Error('Narrative events not indexed');
 const parsed=requestArgs(args);
 const books=index.books||{};
 const scores=new Map();
 for(const ev of index.events||[]){
  if(!books[ev.bookId]||books[ev.bookId].chapterCount<ev.chapter)continue;
  if(parsed.bookId&&ev.bookId!==parsed.bookId)continue;
  const relevance=eventScore(ev,parsed.query);
  if(relevance<=0)continue;
  if(!scores.has(ev.bookId))scores.set(ev.bookId,[]);
  scores.get(ev.bookId).push({ev,relevance});
 }
 const ranked=[...scores.entries()].map(([id,evs])=>{
  evs.sort((a,b)=>b.relevance-a.relevance||a.ev.chapter-b.ev.chapter);
  return {id,evs,relevance:evs[0].relevance};
 }).sort((a,b)=>b.relevance-a.relevance||books[a.id].title.localeCompare(books[b.id].title)).slice(0,Math.min(8,limit));
 return {
  schema:'novalume.narrative-search.v1',query:parsed.query,
  scope:'rights-cleared hosted original-language public-domain books only',
  interpretation:'Source-anchored editorial candidate events; interpretations are not independently human verified.',
  revelation:parsed.reveal?'explicit-chapter-limited':'book-title-only',
  results:ranked.map(({id,evs})=>{
   const base={bookId:id,title:books[id].title,matchType:'partial-event-or-topic-overlap',
     bookUrl:'/#book/'+encodeURIComponent(id),detailsHidden:!parsed.reveal};
   if(!parsed.reveal)return base;
   return {...base,detailsHidden:false,chapterLimit:parsed.chapterLimit,
     events:evs.filter(({ev})=>ev.chapter<=parsed.chapterLimit).slice(0,6).map(({ev})=>({
       id:ev.id,summary:ev.summary,chapter:ev.chapter,
       chapterTitle:ev.chapterTitle,paragraph:ev.paragraph,
       topics:ev.topics.slice(0,6),relation:ev.relation,
       verification:ev.status==='human-reviewed'?'human-reviewed':'source-anchored-editorial-sample'
     }))};
  })
 };
}
export function readEventIndex(){return JSON.parse(fs.readFileSync(DATA,'utf8'));}
