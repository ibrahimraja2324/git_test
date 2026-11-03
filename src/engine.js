/** Deterministic, explainable baseline. This is NOT an LLM and makes no claims about unseen chapters. */
export const tagAliases = {
  'hidden identity':['secret identity','identity revealed','secretly powerful','hidden power','underestimated','secret'],
  'earned progression':['progression','leveling','power growth','training','gets stronger','weak to strong','growth'],
  'public reaction':['people react','public recognition','crowd reaction','everyone shocked','reputation'],
  'family conflict':['family regret','betrayed by family','rejected son','family','inheritance','siblings'],
  'revenge':['revenge','retaliation','payback','betrayal','vindication'],
  'political intrigue':['politics','power struggle','court','kingdom','political','scheming'],
  'slow burn':['slow romance','gradual','slow burn','long buildup'],
  'clever protagonist':['smart male lead','strategic','clever','intelligent protagonist','wit'],
  'adventure':['adventure','exploration','journey','travel'],
  'mystery':['mystery','detective','whodunit','investigation','clues'],
  'romance':['romance','love','relationship','marriage'],
  'fantasy':['fantasy','magic','supernatural','dragon','wizard'],
  'science fiction':['science fiction','sci fi','time travel','future','space'],
  'horror':['horror','gothic','frightening','scary','monster'],
  'social commentary':['society','class','inequality','social satire']
};
const stop = new Set('i want a find me book books story stories novel novels with where which the that this is are there and or not but for in by from has have it like about really lots of many no some something that as who protagonist character lead male female'.split(' '));
export function tokenize(text=''){ return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>!stop.has(w)&&w.length>2) }
export function parseIntent(query=''){
 const q=query.toLowerCase(), terms=tokenize(q);
 const wanted=new Set();
 for(const [tag,patterns] of Object.entries(tagAliases)) if(patterns.some(p=>q.includes(p)))wanted.add(tag);
 return {terms,wanted:[...wanted],query};
}
/** Lexical evidence is weak support, NEVER a claim that a narrative event happened. */
const evidenceAlias={
 'identity-and-recognition':['identity','hidden identity','secret identity','disguise'],
 'family-and-kinship':['family','family conflict','mother','father','brother','sister'],
 'betrayal-and-deception':['betrayal','revenge','deceived'],
 'vindication-and-regret':['family regret','regret','forgiveness','vindication'],
 'public-reaction':['public reaction','everyone shocked','recognition','crowd'],
 'status-and-ranking':['earned progression','progression','rank','status'],
 'practice-and-training':['earned progression','training','cultivation'],
 'mystery-and-investigation':['mystery','investigation','detective'],
 'romance-and-affection':['romance','slow burn','marriage'],
 'journey-and-exploration':['adventure','journey','exploration'],
 'science-and-technology':['science fiction','future','technology'],
 'power-and-authority':['political intrigue','politics','kingdom'],
 'magic-and-supernatural':['fantasy','magic','ghost']
};
export function evidenceBoost(book,query='',preferred=[]){
 const counts=book.evidenceCounts||{}, q=[query,...preferred].join(' ').toLowerCase();
 if(!q.trim())return {bonus:0,reasons:[]};
 let bonus=0;const reasons=[];
 for(const [id,terms] of Object.entries(evidenceAlias)){
   if(!counts[id])continue;
   if(terms.some(term=>q.includes(term))){bonus+=Math.min(3,1+Math.log2(1+counts[id]));reasons.push(id.replaceAll('-',' '))}
 }
 return {bonus:Math.min(8,bonus),reasons:reasons.slice(0,2)};
}
export function scoreBook(book,query='',preferred=[]){
 const intent=parseIntent(query); const tags=(book.tags||[]).map(t=>t.toLowerCase());
 const text=[book.title,book.author,book.blurb,...tags,...(book.storySignals||[])].join(' ').toLowerCase();
 let score=0, reasons=[];
 for(const tag of [...new Set([...intent.wanted,...preferred.map(t=>t.toLowerCase())])]) {
  if(tags.includes(tag)){score+=10;reasons.push(tag)}
  else if(text.includes(tag)){score+=4;reasons.push(tag)}
 }
 for(const term of intent.terms){ if(tags.some(t=>t.includes(term))){score+=3}else if(text.includes(term)){score+=1} }
 const extra=evidenceBoost(book,query,preferred);score+=extra.bonus;
 if(!query.trim()&&preferred.length===0) score=(book.featured||0)*4;
 if(book.status==='ready') score+=2;
 return {...book,matchScore:score,matchReasons:[...new Set(reasons)].slice(0,3),evidenceReasons:extra.reasons};
}
export function rankBooks(catalog,query='',preferred=[],filter='All'){
 return catalog.filter(b=>filter==='All'||b.genre===filter||b.tags.includes(filter.toLowerCase()))
 .map(b=>scoreBook(b,query,preferred))
 .filter(b=>!query.trim()||b.matchScore>0)
 .sort((a,b)=>b.matchScore-a.matchScore||a.title.localeCompare(b.title));
}
export function initials(name){return (name||'R').split(/\s+/).map(t=>t.charAt(0)).slice(0,2).join('').toUpperCase()}
