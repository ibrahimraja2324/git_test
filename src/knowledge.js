/** Pure, offline, source-grounded reader AI context. Nothing here requires a model. */
import {tokenize} from './engine.js';
export const PACKET_SCHEMA='novalume.reader-context.v1';
const unique=items=>[...new Set(items)];

export function evidenceForQuestion(knowledge, question='', maxChapter=0, limit=10){
  if(!knowledge || knowledge.schema!=='novalume.narrative-evidence.v1')return [];
  const cutoff=Math.min(Math.max(0,Math.floor(Number(maxChapter)||0)),knowledge.chapterCount);
  if(cutoff===0)return [];
  const terms=unique(tokenize(question));
  const found=[];
  for(const chapter of knowledge.chapters||[]){
    if(chapter.number>cutoff)continue;
    for(const observation of chapter.observations||[]){
      if(observation.chapter>cutoff)continue;
      const text=`${observation.excerpt||''} ${observation.label||''} ${(observation.matchedTerms||[]).join(' ')}`.toLowerCase();
      const score=terms.length?terms.reduce((n,t)=>n+(text.includes(t)?1:0),0):1;
      if(score>0)found.push({...observation,score});
    }
  }
  return found.sort((a,b)=>b.score-a.score||a.chapter-b.chapter||a.paragraph-b.paragraph).slice(0,limit);
}

export function buildContextPacket(book,knowledge,question,readThrough,preferences=[],maxObservations=12){
  if(!book || book.status!=='ready' || !book.id || !knowledge || book.id!==knowledge.bookId)
    throw new Error('A reviewed, hosted story and matching static index are required.');
  if(knowledge.schema!=='novalume.narrative-evidence.v1')throw new Error('Unknown index schema');
  const cutoff=Math.min(book.chapterCount,knowledge.chapterCount,Math.max(0,Math.floor(Number(readThrough)||0)));
  const chosen=evidenceForQuestion(knowledge,question,cutoff,maxObservations).map(({score,...obs})=>({
    chapter:obs.chapter, paragraph:obs.paragraph, signal:obs.label, cue:obs.matchedTerms,
    excerpt:obs.excerpt,sourceHash:obs.sourceHash,verification:obs.verification,
    source:`#read/${book.id}/${obs.chapter}`
  }));
  return {
    schema:PACKET_SCHEMA,
    story:{id:book.id,title:book.title,author:book.author,publicBlurb:book.blurb},
    question:String(question||'What does the available story evidence suggest?').slice(0,700),
    readThroughChapter:cutoff,
    knownChapterCount:cutoff, // never leak the total future count to personal context
    readerPreferences:preferences.slice(0,12).map(String),
    observations:chosen,
    caveats:[
      'Clues are produced by deterministic lexical rules, not verified narrative-event extraction.',
      'A term match does not demonstrate that the event happened, or how important it is.',
      'Only cite included excerpts, with chapter and paragraph. If evidence is missing, say so.',
      'No future chapters are included, regardless of what the model asks.'
    ]
  };
}

export function contextPrompt(packet){
  if(!packet || packet.schema!==PACKET_SCHEMA)throw new Error('Invalid reader context');
  return `You are the reader's private fiction assistant. Answer their question using ONLY the evidence in the JSON packet below.\nThis packet contains lexical clues, NOT verified plot facts. Do not assert an event occurred merely because a term matched.\nDo not invent future events, chapters, quotations or character relationships. Explicitly state when evidence is insufficient. Cite any observations as (chapter N, paragraph N).\nRespect the reader's chapter limit: ${packet.readThroughChapter}.\n\n${JSON.stringify(packet,null,2)}\n\nAnswer the reader's question carefully.`;
}

export async function askLocalModel(packet,options={}){
  const {provider,model,fetchImpl=fetch}=options;
  if(!['ollama','lmstudio'].includes(provider))throw new Error('Only explicitly supported local providers are allowed.');
  if(typeof model!=='string'||!/^[-\w./:]{1,100}$/.test(model))throw new Error('Provide a valid local model identifier.');
  const url=provider==='ollama'?'http://127.0.0.1:11434/api/chat':'http://127.0.0.1:1234/v1/chat/completions';
  const prompt=contextPrompt(packet);
  const body=provider==='ollama'
    ?{model,stream:false,messages:[{role:'user',content:prompt}],options:{num_predict:600}}
    :{model,stream:false,messages:[{role:'user',content:prompt}],max_tokens:600};
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),45000);
  try{
    const response=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
    if(!response.ok)throw new Error(`Local model returned HTTP ${response.status}`);
    const result=await response.json();
    return (provider==='ollama'?result.message?.content:result.choices?.[0]?.message?.content)||'The model returned no text.';
  }finally{clearTimeout(timeout)}
}
