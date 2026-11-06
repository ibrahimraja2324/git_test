#!/usr/bin/env python3
"""Build chapter-grounded narrative event index for reviewed and processable texts ONLY.

Human/assistant annotations are hypotheses with explicit chapter/paragraph anchors.
Mechanical anchor validation is NOT equivalent to independent semantic review.
Author or publisher submissions require affirmative, scoped analysis rights.
No crawling, network requests, third-party chapter texts, or paid AI calls.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'content' / 'rights_manifest.json'
REVIEWED = ROOT / 'content' / 'reviewed_story_events.json'
BOOKS = ROOT / 'public' / 'data' / 'books'
PRIVATE = ROOT / 'server' / 'private' / 'reviewed_events.json'
PUBLIC_STATS = ROOT / 'public' / 'data' / 'narrative_coverage.json'
INPUT_SCHEMA = 'novalume.reviewed-narrative-events.v1'
OUTPUT_SCHEMA = 'novalume.private-narrative-events.v1'
TIERS = {'intro', 'development', 'major'}
STATES = {'editorial-sample', 'human-reviewed'}
FORBIDDEN = {'external-index', 'unreviewed','unspecified'}


def sha(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def valid_text(value, field, min_len=1, max_len=240):
    if not isinstance(value, str) or not min_len <= len(value.strip()) <= max_len:
        raise ValueError(f'Invalid {field}')
    if any(c in value for c in ('<script', '</script', '\x00')):
        raise ValueError('Potentially unsafe literal '+field)
    return value.strip()


def build_index(manifest, hosted, annotations):
    """Pure computation for QA and repeatable rebuilds."""
    if annotations.get('schema') != INPUT_SCHEMA or not isinstance(annotations.get('events'), list):
        raise ValueError('Unknown event annotation schema')
    rights = {r['id']: r for r in manifest}
    books = {}
    for book_id, asset in hosted.items():
        record = rights.get(book_id)
        if not record or record['rights']['decision'] != 'approved' or \
                record['rights'].get('analysisPermissions',{}).get('allowed') is not True or \
                record['rights'].get('analysisPermissions',{}).get('basis') != 'original-public-domain-and-cc0-edition':
            continue
        # The approved public-domain source edition is eligible for text analysis.
        # Any later non-public-domain work must have an explicit independent grant,
        # and is NOT ingested by this public-classics-only pipeline.
        if record.get('translation') is not False or record.get('originalLanguage') != 'en':
            continue
        chapters = asset.get('chapters', [])
        if chapters:
            books[book_id] = {
                'title':record['title'], 'chapterCount':len(chapters),
                'chapters':chapters,
                'sourceSha256':sha(json.dumps(asset, ensure_ascii=False, separators=(',', ':')))
            }
    seen = set()
    events = []
    for item in annotations['events']:
        eid = valid_text(item.get('id'), 'id', 3, 90)
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', eid) or eid in seen:
            raise ValueError('Duplicate or invalid event ID')
        seen.add(eid)
        book_id = item.get('bookId')
        if book_id not in books:
            raise ValueError('Unapproved or unhosted book cannot be analysed: '+str(book_id))
        book = books[book_id]
        ch = item.get('chapter')
        para = item.get('paragraph')
        if type(ch) is not int or not 1 <= ch <= book['chapterCount']:
            raise ValueError('Invalid chapter anchor')
        chapter = book['chapters'][ch-1]
        paras = chapter.get('paragraphs',[])
        if type(para) is not int or not 1 <= para <= len(paras):
            raise ValueError('Invalid paragraph anchor')
        content = paras[para-1]
        anchor = valid_text(item.get('sourceAnchor'),'sourceAnchor',12,150)
        if anchor.casefold() not in content.casefold():
            raise ValueError('Source anchor not found in exact chapter and paragraph: '+eid)
        tier = item.get('spoilerTier')
        if tier not in TIERS or item.get('status') not in STATES:
            raise ValueError('Unapproved spoiler tier or review status')
        reviewer = valid_text(item.get('reviewer'),'reviewer',5,100)
        if not re.fullmatch(r'20\d\d-\d\d-\d\d',item.get('reviewedAt','')):
            raise ValueError('Invalid review timestamp')
        rel = item.get('relation')
        if not isinstance(rel,dict) or set(rel) != {'type','actor','predicate','object'}:
            raise ValueError('Relation must have exact provenance model')
        fields = {key:valid_text(rel[key],key,2,130) for key in ('type','actor','predicate','object')}
        topics = item.get('topics')
        if not isinstance(topics,list) or not 1 <= len(topics) <= 12:
            raise ValueError('At least one open-vocabulary topic required')
        topics = [valid_text(t,'topic',2,65) for t in topics]
        statement = valid_text(item.get('summary'),'event summary',30,220)
        events.append({
            'id':eid, 'bookId':book_id, 'chapter':ch, 'paragraph':para,
            'chapterTitle':str(chapter.get('title',f'Chapter {ch}'))[:100],
            'relation':fields,'summary':statement,'topics':topics,'spoilerTier':tier,
            'status':item['status'],'reviewer':reviewer,'reviewedAt':item['reviewedAt'],
            'paragraphSha256':sha(content),
            'sourceSha256':book['sourceSha256'],
            'evidenceType':'editorial-statement-with-exact-text-anchor',
            # Never store full source paragraphs in the event index.
        })
    events.sort(key=lambda x:(x['bookId'],x['chapter'],x['paragraph'],x['id']))
    private = {
        'schema':OUTPUT_SCHEMA,
        'sourceScope':'approved-english-original-public-domain-editions-only',
        'reviewCaveat':'Source anchors exist, but AI/editorial semantic interpretations have not received independent human confirmation.',
        'books':{k:{'title':v['title'],'chapterCount':v['chapterCount'],'sourceSha256':v['sourceSha256']}
                 for k,v in books.items()},
        'events':events
    }
    coverage = {
        'schema':'novalume.narrative-coverage.v1',
        'process':'source-anchored editorial analysis, NOT exhaustive AI chapter interpretation',
        'books':{
            k:{
                'chapterCount':v['chapterCount'],
                'chaptersWithAnnotatedEvents':len({e['chapter'] for e in events if e['bookId']==k}),
                'editorialSampleEvents':sum(e['bookId']==k for e in events),
                'independentlyReviewedEvents':sum(e['bookId']==k and e['status']=='human-reviewed' for e in events)
            } for k,v in books.items()
        }
    }
    return private, coverage


def build():
    rights = json.loads(MANIFEST.read_text(encoding='utf-8'))
    source = json.loads(REVIEWED.read_text(encoding='utf-8'))
    hosted = {}
    for row in rights:
        if row['rights']['decision'] != 'approved':
            continue
        path = BOOKS/f"{row['id']}.json"
        if path.is_file():
            hosted[row['id']] = json.loads(path.read_text(encoding='utf-8'))
    private,coverage = build_index(rights,hosted,source)
    PRIVATE.parent.mkdir(parents=True,exist_ok=True)
    PRIVATE.write_text(json.dumps(private,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    PUBLIC_STATS.write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Chapter event index: {len(private["events"])} source-anchored editorial events, across {len(private["books"])} authorised editions. No cloud AI calls.')
    return private


if __name__ == '__main__':
    build()
