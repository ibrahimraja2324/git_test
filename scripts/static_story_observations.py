#!/usr/bin/env python3
"""Deterministic, high-recall sentence evidence mining for *permitted* Novalume works.

This produces a retrievable evidence lattice, NOT an AI-generated plot summary:
facts about plot events, agents, causality, chronology and witnesses require
interpretation or human review. Inputs are complete, rights-approved original
English works only; external linked novels are never fetched or examined.
"""
from __future__ import annotations
from collections import Counter, defaultdict
import hashlib
import json
import re
from pathlib import Path

from dynamic_narrative import entities_in, normalize, tokens, STOP

ROOT = Path(__file__).resolve().parents[1]
RIGHTS = ROOT/'content'/'rights_manifest.json'
BOOKS = ROOT/'public'/'data'/'books'
PRIVATE = ROOT/'server'/'private'/'static_observations'
PUBLIC = ROOT/'public'/'data'/'static_observation_stats.json'
SCHEMA = 'novalume.private-static-observations.v1'
SPLIT = re.compile(r'(?<=[.!?])\s+(?=[“"‘A-Z0-9])')
VERB = re.compile(
    r'\b(?:said|told|asked|replied|claimed|believed|thought|knew|learned|'
    r'saw|seen|heard|found|discovered|realised|realized|understood|'
    r'began|became|made|made|gave|took|came|went|left|returned|'
    r'killed|died|married|hated|loved|lost|won|rose|fell|broke|'
    r'showed|revealed|refused|decided|chose|promised|vowed|'
    r'would|could|might|must|will|shall|'
    r'[a-z]{3,}(?:ed|ing|izes|ises|s))\b',re.I)
CUES = {
    # Not a fixed trope ontology. These are transparent ranking hints;
    # the text terms remain open vocabulary and evidence is always unverified.
    'communication':('said','asked','told','replied','letter','called','spoke','wrote','declared'),
    'knowledge':('discovered','knew','learned','realised','realized','understood','revealed','truth','secret','recognized'),
    'belief':('believed','thought','suspected','seemed','supposed','imagined','mistaken','misunderstood'),
    'emotion':('horror','horrified','fear','afraid','shocked','astonished','joy','grief','regret','ashamed','disgust'),
    'conflict':('fought','attacked','killed','murdered','destroyed','betrayed','threatened','refused','denied','rejected'),
    'relationship':('married','marriage','lover','husband','wife','mother','father','brother','daughter','friend','enemy'),
    'progression':('level','rank','realm','power','stronger','training','cultivation','advanced','master','ability','skill'),
    'decision':('decided','chose','promised','vowed','resolved','intended','planned','agreed'),
    'public-reaction':('crowd','crowds','spectators','everyone','people','villagers','audience','cheered','applauded'),
    'reputation':('famous','known','recognition','reputation','renowned','title','rank','honour','honor'),
    'movement':('entered','left','returned','arrived','departed','escaped','journey','travelled'),
    'loss':('died','death','murdered','lost','grief','destroyed','vanished'),
    'supernatural':('vampire','magic','monster','creature','ghost','spell','curse','immortal'),
}
MODAL = re.compile(r'\b(if|might|may|could|would|perhaps|possibly|suppose|wish|hope|imagined|dreamed)\b',re.I)
NEGATION = re.compile(r"\b(not|never|no|cannot|couldn't|wouldn't|didn't|don't|won't|nor|neither)\b",re.I)
REPORTED = re.compile(r'\b(said|told|claimed|reported|heard|rumour|rumor|believed|thought|suspected)\b',re.I)
NUMBER_CHANGE = re.compile(r'\b(?:level|rank|tier|stage|realm|points|years|power)\s*(?:[0-9]{1,5}|[IVX]{1,8})\b|\b[0-9]{1,5}\s*(?:points|levels|ranks|years)\b',re.I)


def sha(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def sentences(paragraph):
    """Never discard unsplit remainder, and preserve deterministic source spans."""
    start=0
    for match in SPLIT.finditer(paragraph):
        end=match.start()
        if paragraph[start:end].strip():
            yield start,end,paragraph[start:end]
        start=match.end()
    if paragraph[start:].strip():
        yield start,len(paragraph),paragraph[start:]


def permits_static_analysis(record):
    rights=record.get('rights',{})
    grant=rights.get('analysisPermissions',{})
    return (rights.get('decision')=='approved' and
            grant.get('allowed') is True and
            grant.get('basis')=='original-public-domain-and-cc0-edition' and
            record.get('originalLanguage')=='en' and
            record.get('translation') is False)


def sentence_observation(book_id,chapter,paragraph,offset,raw,full_text):
    text=normalize(raw)
    ts=tokens(text)
    meaningful=[w for w in ts if w not in STOP and len(w)>=3]
    if len(meaningful)<3:return None
    verbs=list(dict.fromkeys(m.group(0).lower() for m in VERB.finditer(text)))
    if not verbs:return None
    observed_terms=list(dict.fromkeys(meaningful))
    labels=[name for name,hints in CUES.items() if set(hints)&set(ts)]
    names=entities_in(text)
    # Names may be omitted or misidentified: entity mentions are not
    # resolved character identities. Never silently fix pronoun references.
    identity=sha(f'{book_id}|{chapter}|{paragraph}|{offset}|{raw}')[:24]
    return {
        'id':identity,'bookId':book_id,'chapter':chapter,
        'paragraph':paragraph,'offset':offset,
        'paragraphSha256':sha(full_text),
        'sentenceSha256':sha(raw),
        'evidencePreview':text[:195],
        'terms':observed_terms[:55],
        'predicateCandidates':verbs[:14],
        'entityMentions':names[:15],
        'rankingHints':labels,
        'numericExpressions':[m.group(0) for m in NUMBER_CHANGE.finditer(text)][:8],
        'uncertainty':{
            'negationPresent':bool(NEGATION.search(text)),
            'hypotheticalLanguage':bool(MODAL.search(text)),
            'reportedOrAttributed':bool(REPORTED.search(text)),
            'dialoguePossible':any(c in text for c in ('“','”','"','‘','’')),
            'questionPossible':'?' in text
        },
        'verification':'literal-text-candidate-not-confirmed-plot-fact'
    }


def mine_book(book_id,book,rights_record):
    if not permits_static_analysis(rights_record):
        raise PermissionError('Analysis of this edition is not authorised')
    if book.get('id')!=book_id or not isinstance(book.get('chapters'),list) or not book['chapters']:
        raise ValueError('Invalid source manuscript')
    observations=[];all_sentences=0;chapter_counts=Counter();signal_counts=Counter()
    source_sha=sha(json.dumps(book,ensure_ascii=False,sort_keys=True))
    for ci,ch in enumerate(book['chapters'],1):
        for pi,p in enumerate(ch.get('paragraphs') or [],1):
            if not isinstance(p,str):raise ValueError('Source paragraph is not a string')
            for start,end,s in sentences(p):
                all_sentences+=1
                candidate=sentence_observation(book_id,ci,pi,start,s,p)
                if not candidate:continue
                observations.append(candidate)
                chapter_counts[ci]+=1
                signal_counts.update(candidate['rankingHints'])
    private={
        'schema':SCHEMA,'sourcePolicy':'rights-cleared-original-english-only',
        'interpretation':'Textual trigger observations, NOT verified plot, causality, relationship or progression facts.',
        'bookId':book_id,'sourceSha256':source_sha,'chapterCount':len(book['chapters']),
        'sentenceCount':all_sentences,'candidateCount':len(observations),
        'observations':observations
    }
    public={
        'bookId':book_id,'chapterCount':len(book['chapters']),
        'observedSentences':all_sentences,'candidateObservations':len(observations),
        'chapterCoverage':len(chapter_counts),
        'rankingHintCounts':dict(signal_counts),
        'sourceSha256':source_sha,
        'verification':'automated-textual-patterns-not-reviewed-events'
    }
    return private,public


def build():
    manifest=json.loads(RIGHTS.read_text(encoding='utf-8'))
    PRIVATE.mkdir(parents=True,exist_ok=True)
    approved=set();stats={}
    for record in manifest:
        if not permits_static_analysis(record):continue
        book_id=record['id']
        path=BOOKS/(book_id+'.json')
        if not path.exists():continue
        book=json.loads(path.read_text(encoding='utf-8'))
        private,public=mine_book(book_id,book,record)
        private['title']=record['title']
        (PRIVATE/(book_id+'.json')).write_text(json.dumps(private,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
        approved.add(book_id);stats[book_id]=public
    for path in PRIVATE.glob('*.json'):
        if path.stem not in approved:path.unlink()
    payload={'schema':'novalume.static-text-evidence-stats.v1',
             'notice':'Candidate passages and thematic hints; not independent narrative understanding or reviewed facts.',
             'books':stats,
             'aggregate':{
                 'analysedBooks':len(stats),
                 'analysedChapters':sum(x['chapterCount'] for x in stats.values()),
                 'observedSentences':sum(x['observedSentences'] for x in stats.values()),
                 'candidateObservations':sum(x['candidateObservations'] for x in stats.values())
             }}
    PUBLIC.parent.mkdir(parents=True,exist_ok=True)
    PUBLIC.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Static chapter observations: '+str(payload['aggregate']))
    return payload


if __name__=='__main__':
    build()
