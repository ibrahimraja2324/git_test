/** Search *private* text-derived metadata; expose only spoiler-safe book results.
 * No AI inference, no author-supplied taxonomy requirements, no secret key.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stop=new Set('the a an and to of at by from in on is are was were for you your me my i it its book books novel novels story stories where with who does have had are has that which how one will would want about like shows find looking need not no without avoid excluding this these those he she they them him her their'.split(' '));
const word=s=>(String(s||'').toLowerCase().match(/[\p{L}\p{N}']+/gu)||[]).filter(w=>(w.length>2||['ai','vr','ar','mc','fl','3d','2d','sf'].includes(w))&&!stop.has(w)).slice(0,100);
/** Stronger lexical check: every word in each concept must appear in ONE paragraph.
 * Two concepts need not be in the same paragraph unless explicitly requested.
 * This is still NOT evidence that an asserted event or relationship happened.
 */
function hasPassageEvidence(index,concepts){
  const clauses=concepts.map(c=>[...new Set(word(c))]);
  if(!clauses.length||clauses.some(terms=>!terms.length))return false;
  if(Array.isArray(index.passageTerms))return index.passageTerms.some(p=>{
    const words=new Set(p.terms||[]);
    return clauses.every(terms=>terms.every(t=>words.has(t)));
  });
  // Legacy index: only a single observed phrase supplies co-occurrence evidence.
  return (index.dynamicPhrases||[]).some(p=>{
    const words=new Set(word(p.phrase));
    return clauses.every(terms=>terms.every(t=>words.has(t)));
  });
}

function safeQuery(body){
  const query=String(body?.query||body?.q||'').trim().slice(0,500);
  const avoid=Array.isArray(body?.avoid)?body.avoid.slice(0,12).map(x=>String(x).slice(0,100)):[];
  const negativePhrases=[...query.matchAll(/\b(?:avoid|without|excluding|no)\s+([^,;.!?]+)/gi)];
  const positives=query.replace(/\b(?:avoid|without|excluding|no)\s+[^,;.!?]+/gi,' ').trim();
  avoid.push(...negativePhrases.map(x=>x[1].trim().slice(0,100)));
  const requiredConcepts=Array.isArray(body?.requiredConcepts)?body.requiredConcepts.slice(0,8).map(x=>String(x).slice(0,130)):[];
  const interests=Array.isArray(body?.interests)?body.interests.slice(0,12).map(x=>String(x).slice(0,100)):[];
  if(!query)throw Object.assign(new Error('Please enter a story description.'),{status:400});
  return {query,positiveQuery:positives||query,avoid,interests,requiredConcepts,
    samePassage:body?.samePassage===true||body?.samePassage==='true'};
}
function candidateScore(index,query,interests=[],avoid=[]){
  const target=new Set(word([query,...interests].join(' ')));
  if(!target.size)return 0;
  const appearances=new Map();
  for(const p of index.dynamicPhrases||[]){
    const words=new Set(word(p.phrase));
    const found=[...words].filter(w=>target.has(w));
    if(found.length){for(const token of found){const score=(1+Math.log1p(p.paragraphFrequency||1))/Math.sqrt(words.size||1);
       appearances.set(token,Math.max(appearances.get(token)||0,score));}}
  }
  for(const entity of index.candidateEntities||[]){
    for(const term of word(entity.text))if(target.has(term))appearances.set(term,Math.max(appearances.get(term)||0,1+Math.log1p(entity.paragraphFrequency||1)));
  }
  let score=0;for(const val of appearances.values())score+=val;
  // Negative filters never claim absence; only text overlap can penalize evidence.
  for(const clause of avoid){if(hasPassageEvidence(index,[clause]))score-=6;}
  // Query coverage and text length normalization prevent a giant book winning merely by size.
  const coverage=appearances.size/Math.max(target.size,1);
  return Math.max(0,Number((score/Math.sqrt(1+Math.log1p(index.paragraphCount||1))*coverage).toFixed(4)));
}
export function searchBooks({query,positiveQuery=query,interests=[],avoid=[],requiredConcepts=[],samePassage=false},catalog,indexes,{limit=12}={}){
  if(!query||typeof query!=='string')return [];
  const scored=[];
  for(const b of catalog){
    if(b.status!=='ready')continue;
    const idx=indexes[b.id];if(!idx)continue;
    if(requiredConcepts.length&&(samePassage
      ?!hasPassageEvidence(idx,requiredConcepts)
      :requiredConcepts.some(requirement=>!hasPassageEvidence(idx,[requirement]))))continue;
    const relevance=candidateScore(idx,positiveQuery,interests,avoid);
    if(relevance<=0)continue;
    // Never return private phrases, candidate entity names, evidence, future locations or excerpts.
    scored.push({id:b.id,title:b.title,author:b.author,genre:b.genre,
      publicBlurb:b.blurb,availableChapters:b.chapterCount,source:b.sourceUrl,
      matchStrength:relevance>1.8?'strong-textual-overlap':relevance>.5?'some-textual-overlap':'weak-textual-overlap',
      explanation:'Candidate match found in privately indexed novel text. Narrative event and payoff not verified.',
      readingUrl:`/#book/${encodeURIComponent(b.id)}`,score:relevance});
  }
  scored.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
  return scored.slice(0,Math.min(limit,20)).map(({score,...other})=>other);
}
export function readSearchData(){
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'public/data/catalog.json'),'utf8'));
  const indexes={};
  const base=path.join(root,'server/private/indexes');
  if(fs.existsSync(base))for(const b of catalog){
    if(b.status!=='ready'||!/^[-a-z0-9]+$/.test(b.id))continue;
    const filename=path.join(base,b.id+'.json');
    if(fs.existsSync(filename))indexes[b.id]=JSON.parse(fs.readFileSync(filename,'utf8'));
  }
  return {catalog,indexes};
}
export {safeQuery};
