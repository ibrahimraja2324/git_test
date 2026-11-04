#!/usr/bin/env python3
"""CPU-only open-vocabulary story candidate mining.

No fixed genre/trope whitelist controls what can be extracted. Every surface phrase
comes from the actual licensed text. Results are *observations*, not plot facts.
Keep private records outside the static public directory; only safe counts ship.
"""
from __future__ import annotations
from collections import Counter, defaultdict
from dataclasses import dataclass
import hashlib
import json
import math
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TOKEN=re.compile(r"[\w]+(?:['’][\w]+)?",re.UNICODE)
SENTENCE=re.compile(r'(?<=[.!?])\s+(?=[“"A-Z])')
# Stopwords only help rank phrases; they are NOT a closed catalogue of story tags.
STOP=set(('a an and are as at be because been before but by can could did do does for from had has have he her hers him his how i if in into is it its just may me more most my no nor not of on or our out over she so some such than that the their them there these they this those through to too under up us very was were what when where which while who whom why will with would you your said say says mr mrs miss sir yes oh ah one two three then now all much again only also even we get got having being himself herself myself yourself ourselves themselves other any every each many after few well however though yet still almost quite rather perhaps never ever always shall should might must dont cant wasnt didnt isnt wasnt wont isnt im youre its'.split()))
TITLE_WORDS={'Mr','Mrs','Miss','Ms','Dr','Professor','Count','Lady','Sir','Lord','King','Queen','Captain','Doctor'}
EXCLUDE_ENTITY={'The','A','An','One','And','But','For','Then','Now','However','Well','Yes','No','Oh','I','He','She','We','It','You','They','If','When','Where','Which','At','In','On','By','This','That','There','Who','What','Why','How','My','Her','His','Our','Your'}
SCHEMA='novalume.dynamic-text-evidence.v2'


def normalize(s):return re.sub(r'\s+',' ',str(s or '')).strip()
def tokens(s):return [t.lower().replace('’',"'") for t in TOKEN.findall(s)]
def fingerprint(book_id,chapter,pnum,content):
    return hashlib.sha256(f'{book_id}\n{chapter}\n{pnum}\n{content}'.encode()).hexdigest()[:20]

def entities_in(text):
    """Extract names from orthographic cues. May include false positives, so label as candidates."""
    matcher=re.compile(r'(?<!\w)(?:(?:Mr|Mrs|Miss|Ms|Dr|Professor|Count|Lady|Sir|Lord|King|Queen|Captain|Doctor)\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}')
    found=[]
    for m in matcher.finditer(text):
        value=m.group(0).strip().rstrip('.')
        pieces=value.replace('.','').split()
        if len(pieces)==1 and (pieces[0] in EXCLUDE_ENTITY or len(pieces[0])<4):continue
        if len(pieces)==1 and m.start()==0:continue  # opening words frequently not names
        if value not in found:found.append(value)
    return found[:18]


def get_candidate_phrases(terms,max_ngram=5):
    for n in range(1,max_ngram+1):
        for i in range(len(terms)-n+1):
            window=terms[i:i+n]
            if any(len(w)<2 or w.isnumeric() for w in window):continue
            if window[0] in STOP or window[-1] in STOP:continue
            if n==1:
                if window[0] in STOP or len(window[0])<5:continue
            elif sum(w not in STOP for w in window)<2:continue
            yield ' '.join(window)


def mine_book(book_id,chapters,max_phrases=260,max_entity_pairs=100,max_passages_per_phrase=5):
    """Dynamic candidate phrases, entities and co-presence edges with provenance.

    All observations are textual and must never be converted into factual plot
    claims without verification. Re-run on revisions (input SHA captured).
    """
    term_count=Counter();occurrences=defaultdict(list);name_count=Counter();name_locations=defaultdict(list)
    pairs=Counter();pair_examples=defaultdict(list);paragraph_count=0;total_terms=0
    source_digest=hashlib.sha256()
    for ci,ch in enumerate(chapters,1):
        for pi,raw in enumerate(ch.get('paragraphs',[]),1):
            p=normalize(raw)
            if not p:continue
            source_digest.update(f'{ci}/{pi}/{p}\n'.encode())
            if len(p)<35:continue
            paragraph_count+=1
            ts=tokens(p);total_terms+=len(ts)
            evidence={'chapter':ci,'paragraph':pi,'sourceHash':fingerprint(book_id,ci,pi,p),
                      'excerpt':p[:240]+('…' if len(p)>240 else '')}
            hits=set(get_candidate_phrases(ts))
            for phrase in hits:
                term_count[phrase]+=1
                if len(occurrences[phrase])<max_passages_per_phrase:occurrences[phrase].append(evidence)
            names=entities_in(p)
            for name in names:
                name_count[name]+=1
                if len(name_locations[name])<max_passages_per_phrase:name_locations[name].append(evidence)
            for n,a in enumerate(names):
                for b in names[n+1:]:
                    if a==b:continue
                    pair=tuple(sorted([a,b]))
                    pairs[pair]+=1
                    if len(pair_examples[pair])<3:pair_examples[pair].append(evidence)
    if not paragraph_count:raise ValueError('No sizeable paragraphs')
    # High-frequency one-word topics + multiword combinations. No book must fit known genre/trope list.
    def score(phrase,frequency):
        words=phrase.split();density=1+min(len(words),4)*.17
        return round((1+math.log2(frequency))*density*math.log2(1+paragraph_count/max(1,frequency)),4)
    # Avoid giant index with >1 million near-unique phrases; repeated ones prioritized.
    ranked=sorted(term_count.items(),key=lambda x:(-score(*x),-x[1],x[0]))[:max_phrases]
    dynamic=[{'phrase':phrase,'paragraphFrequency':freq,'score':score(phrase,freq),
             'verification':'unverified-text-cooccurrence','evidence':occurrences[phrase]}
             for phrase,freq in ranked]
    name_ranked=[{'text':n,'paragraphFrequency':count,'verification':'candidate-name',
                  'evidence':name_locations[n]} for n,count in name_count.most_common(100) if count>=1]
    edge_ranked=[{'left':a,'right':b,'paragraphFrequency':count,
                  'verification':'co-mentioned-not-necessarily-related','evidence':pair_examples[a,b]}
                 for (a,b),count in pairs.most_common(max_entity_pairs)]
    return {'schema':SCHEMA,'bookId':book_id,'chapterCount':len(chapters),
            'sourceSha256':source_digest.hexdigest(),'paragraphCount':paragraph_count,
            'tokenCount':total_terms,'method':'unsupervised-orthographic-phrase-and-entity-mining-v2',
            'note':'All entries are observed strings/candidate names/co-mentions, never verified plot events.',
            'dynamicPhrases':dynamic,'candidateEntities':name_ranked,'coMentions':edge_ranked}


def corpus_idf(indexes):
    docs=len(indexes);doc_freq=Counter()
    for record in indexes:doc_freq.update({e['phrase'] for e in record['dynamicPhrases']})
    return {p:round(math.log((1+docs)/(1+df))+1,4) for p,df in doc_freq.items()}


def score_query(index,query,preference_terms=()):
    """Search private text-derived candidates, not just authored tags.
    Return score only: no excerpts or future facts passed to the untrusted caller.
    """
    q=set(tokens(query)); q.update(t for p in preference_terms for t in tokens(p))
    q={w for w in q if w not in STOP}
    if not q:return (0,0)
    score=0.; matched=0
    for item in index.get('dynamicPhrases',[]):
        phrase=item['phrase']; words=set(phrase.split()); common=q&words
        if not common:continue
        matched+=1
        score+=len(common)/math.sqrt(max(1,len(words)))*(1+math.log1p(item['paragraphFrequency']))
        if phrase==normalize(query).lower():score+=12
    for item in index.get('candidateEntities',[]):
        parts=set(tokens(item['text']))
        if q&parts:score+=(len(q&parts)/math.sqrt(len(parts)))*math.log1p(item['paragraphFrequency'])*1.2
    return round(score,3),matched


def safe_summary(index):
    return {'bookId':index['bookId'],'indexedChapters':index['chapterCount'],
            'textParagraphs':index['paragraphCount'],
            'observedDynamicPhrases':len(index['dynamicPhrases']),
            'candidateEntities':len(index['candidateEntities']),
            'coMentionPatterns':len(index['coMentions']),
            'method':index['method'],'sourceSha256':index['sourceSha256']}


def build():
    manifest=json.loads((ROOT/'content/rights_manifest.json').read_text())
    output=ROOT/'server/private/indexes';output.mkdir(parents=True,exist_ok=True)
    records=[];approved=set()
    for r in manifest:
        path=ROOT/'public/data/books'/f"{r['id']}.json"
        if r['rights']['decision']!='approved' or not path.is_file():continue
        data=json.loads(path.read_text())
        if not data.get('chapters'):continue
        rec=mine_book(r['id'],data['chapters']);approved.add(r['id']);records.append(rec)
        (output/f"{r['id']}.json").write_text(json.dumps(rec,ensure_ascii=False,separators=(',',':'))+'\n')
    for path in output.glob('*.json'):
        if path.stem not in approved:path.unlink()
    # Public metadata reveals counts, hashes only; all phrases, entities, co-mentions stay server side.
    pub={'schema':'novalume.public-index-stats.v1','books':{r['bookId']:safe_summary(r) for r in records}}
    (ROOT/'public/data/index_stats.json').write_text(json.dumps(pub,indent=2)+'\n')
    print('Open-vocabulary private indices:',len(records),'books;',sum(len(x['dynamicPhrases']) for x in records),'dynamic candidates')
    return records

if __name__=='__main__':build()
