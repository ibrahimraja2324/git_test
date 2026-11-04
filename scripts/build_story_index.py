#!/usr/bin/env python3
"""Zero-LLM static story clue extraction. Claims are lexical *observations*, never inferred plot facts.

No cloud calls; no external dependencies; fail-closed with rights and published book assets.
Evidence is keyed to physical chapter/paragraph position and backed by input SHA256.
"""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INPUT=ROOT/'content'/'rights_manifest.json'
LEXICON=ROOT/'content'/'narrative_lexicon.json'
BOOK_DIR=ROOT/'public'/'data'/'books'
OUT_DIR=ROOT/'server'/'private'/'legacy_lexical'
INDEX=ROOT/'public'/'data'/'story_index.json'
SCHEMA='novalume.narrative-evidence.v1'


def normalise(text):
    return re.sub(r'\s+', ' ', text or '').strip()


def matches_term(text, term):
    """Words / phrases at boundaries only; 'art' must not match 'heart'."""
    return re.search(r'(?<!\w)'+re.escape(term)+r'(?!\w)', text, flags=re.IGNORECASE) is not None


def extract(paragraphs, lexicon, max_per_signal=12):
    """Return sampled, provenance-rich evidence without claiming semantic verification."""
    results=[]
    for p_index, item in enumerate(paragraphs):
        p=normalise(item)
        if len(p)<20:
            continue
        for rule in lexicon['signals']:
            found=[term for term in rule['terms'] if matches_term(p,term)]
            if not found:
                continue
            if any(matches_term(p, neg) for neg in rule.get('negations', [])):
                continue
            source=f'{p_index}:{rule["id"]}:{p}'
            results.append({
                'signalId':rule['id'], 'label':rule['label'],
                'group':rule['group'], 'paragraph':p_index+1,
                'matchedTerms':found[:4],
                'excerpt':p[:280] + ('…' if len(p)>280 else ''),
                'sourceHash':hashlib.sha256(source.encode('utf-8')).hexdigest()[:16],
                'verification':'lexical-observation'
            })
    by_rule={}
    for item in results:
        key=item['signalId']
        if len(by_rule.setdefault(key,[])) < max_per_signal:
            by_rule[key].append(item)
    return [item for group in by_rule.values() for item in group]


def analyse_book(book_id, asset, lexicon):
    raw=asset.read_bytes()
    payload=json.loads(raw)
    chapters=payload.get('chapters') or []
    if not chapters:
        raise ValueError('No chapters in '+book_id)
    output=[]
    signal_counts={}
    for chapter_number, chapter in enumerate(chapters,1):
        records=extract(chapter.get('paragraphs') or [],lexicon)
        for observation in records:
            observation['chapter']=chapter_number
            signal_counts[observation['signalId']]=signal_counts.get(observation['signalId'],0)+1
        output.append({'number':chapter_number,'title':chapter.get('title') or f'Chapter {chapter_number}',
                       'observations':records})
    return {'schema':SCHEMA, 'bookId':book_id,'chapterCount':len(chapters),
            'sourceSha256':hashlib.sha256(raw).hexdigest(),
            'lexiconVersion':lexicon['version'],
            'interpretation':'Lexical indicators only; these do not assert events occurred or imply their narrative importance.',
            'signalCounts':signal_counts,'chapters':output}


def build():
    lexicon=json.loads(LEXICON.read_text(encoding='utf-8'))
    ids=[x['id'] for x in lexicon['signals']]
    if len(ids)!=len(set(ids)):
        raise ValueError('Duplicate narrative signals')
    manifest=json.loads(INPUT.read_text(encoding='utf-8'))
    OUT_DIR.mkdir(parents=True,exist_ok=True)
    index={'schema':SCHEMA,'lexiconVersion':lexicon['version'],'books':{}}
    approved=set()
    for row in manifest:
        book_id=row['id']
        asset=BOOK_DIR/f'{book_id}.json'
        if row['rights']['decision']!='approved' or not asset.is_file():
            continue
        approved.add(book_id)
        result=analyse_book(book_id,asset,lexicon)
        (OUT_DIR/f'{book_id}.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
        index['books'][book_id]={'chapterCount':result['chapterCount'],
                                'sourceSha256':result['sourceSha256'],
                                'observations':sum(len(c['observations']) for c in result['chapters'])}
    # Avoid serving stale story index files after rights are revoked.
    for file in OUT_DIR.glob('*.json'):
        if file.stem not in approved:
            file.unlink()
    INDEX.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Built deterministic evidence for',len(approved),'approved books; zero model calls.')

if __name__=='__main__':
    build()
