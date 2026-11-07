#!/usr/bin/env python3
"""Rights-conscious Novalume candidate catalogue intake.

Streaming input from OPEN datasets or voluntarily submitted publisher/author data.
NEVER crawl Webnovel, Royal Road, Wuxiaworld or Novel Updates; NEVER treat an
Open Library printed edition, manga, drama or anime as proof of a serial work.

All generated entries are QUARANTINED review candidates, NOT public titles.
Public promotion requires a documented reviewer decision and legitimate series URL.
"""
from __future__ import annotations
import argparse
import bz2
import csv
import gzip
import json
from pathlib import Path
import re
import sys
import unicodedata
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
HOSTS={'www.royalroad.com','www.novelupdates.com','www.wuxiaworld.com',
       'www.webnovel.com','www.scribblehub.com','tapas.io','www.tapas.io',
       'www.qidian.com','www.jjwxc.net','page.kakao.com','www.kakaopage.com',
       'series.naver.com','www.munpia.com','www.ridibooks.com'}
LANGS={'english':'English','chinese':'Chinese','korean':'Korean','japanese':'Japanese'}
REJECT_MEDIA={'anime','animation','animated series','television series','tv series',
              'manga','manhwa','manhua','comic','webtoon','film','movie','video game',
              'audio drama','tv drama','live action','adaptation'}
WORK_TYPES={'web fiction','web novel','webnovel','web serial','webserial','internet novel',
            'novel series','serialized novel','serial fiction','light novel','novel'}
WORK_HINTS={'web novel','webnovel','web serial','webserial','web fiction',
            'internet novel','online novel','serial fiction','xianxia','wuxia',
            'cultivation novel','progression fantasy','light novel'}
SCHEMA='novalume.metadata-review-proposals.v1'

def norm(value):
    return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',str(value or '')).casefold()).strip()

def comparable(value):
    return re.sub(r'[^\w]+','',norm(value))

def safe_link(value):
    try:
        parsed=urlparse(value)
        return (parsed.scheme=='https' and parsed.hostname in HOSTS and
                not parsed.username and not parsed.password and not parsed.fragment)
    except (ValueError,TypeError):return False

def existing_index(series):
    alias={}
    urls={}
    for work in series:
        for text in [work['title'],*(work.get('aliases') or [])]:
            key=comparable(text)
            if key:alias.setdefault(key,set()).add(work['id'])
        urls[work['sourceUrl'].rstrip('/').lower()]=work['id']
    return alias,urls

def collision(candidate,series):
    alias,urls=existing_index(series)
    idc=[]
    for name in [candidate.get('title'),*(candidate.get('aliases') or [])]:
        for id_ in alias.get(comparable(name),set()):
            if id_ not in idc:idc.append(id_)
    link=candidate.get('sourceUrl') or ''
    exact=urls.get(link.rstrip('/').lower()) if link else None
    return {'sameTitleOrAlias':idc[:12], 'sameLegitimateSourceUrl':exact,
            'mergePolicy':'Never merge by title alone; confirm same author, original work and edition.'}

def proposal(source,source_id,title,author='',language='',work_type='',aliases=(),
             source_url='',metadata_license='',raw_provenance=''):
    if not title or len(title)>180 or not re.search(r'\w',title):
        return None
    source_url=str(source_url or '').strip()
    if source_url and not safe_link(source_url):
        source_url=''
    language=LANGS.get(norm(language),str(language or '').strip()[:50])
    work_type=str(work_type or '').strip()[:75]
    kind=norm(work_type)
    concerns=[]
    if kind in REJECT_MEDIA:return None
    if kind not in WORK_TYPES:concerns.append('Original serialized literary-work type not confirmed')
    if not author or re.fullmatch(r'Q\d+',str(author)):concerns.append('Author identity requires verification')
    if language not in ('Chinese','Korean','English','Japanese'):concerns.append('Original work language unverified')
    if not source_url:concerns.append('Legitimate original/publisher series URL missing')
    return {'source':source,'sourceId':str(source_id),'metadataLicense':metadata_license,
        'work':{'title':str(title).strip(),'author':str(author or '').strip()[:130],
                'originalLanguage':language,'workType':work_type,
                'aliases':[str(x).strip()[:170] for x in aliases if isinstance(x,str) and x.strip()][:15],
                'sourceUrl':source_url},
        'reviewStatus':'quarantine','reviewIssues':concerns,
        'provenance':raw_provenance,'publicationReady':False}

def wikidata_spaqrl(source,series):
    rows=source.get('results',{}).get('bindings')
    if not isinstance(rows,list):raise ValueError('Expected Wikidata SPARQL result bindings')
    out=[]
    for row in rows:
        entity=row.get('item',{}).get('value','')
        qid=entity.rsplit('/',1)[-1]
        if not re.fullmatch(r'Q[1-9]\d*',qid) or urlparse(entity).hostname!='www.wikidata.org':continue
        get=lambda name:row.get(name,{}).get('value','').strip()
        kind=get('workTypeLabel') or 'web fiction'
        if norm(kind) in REJECT_MEDIA:continue
        alt=[x.strip() for x in get('altLabel').split(',') if x.strip()]
        r=proposal('wikidata',qid,get('itemLabel'),get('authorLabel'),get('languageLabel'),
            kind,alt,'','CC0','https://www.wikidata.org/wiki/'+qid)
        if r:
            r['collisions']=collision({**r['work']},series)
            out.append(r)
    return out

def _open_text(file):
    file=str(file)
    if file.endswith('.gz'):return gzip.open(file,'rt',encoding='utf-8',errors='replace')
    if file.endswith('.bz2'):return bz2.open(file,'rt',encoding='utf-8',errors='replace')
    return open(file,'rt',encoding='utf-8',errors='replace')

def openlibrary_dump(file,series,max_records=200000):
    """Stream official Open Library bulk WORK dump. Never infer publisher series
    URL or author name from title alone. This is a REVIEW queue only.
    """
    found=[];seen=set();examined=0
    with _open_text(file) as f:
        for line in f:
            examined+=1
            if examined>max_records:break
            fields=line.rstrip('\n').split('\t',4)
            if len(fields)!=5 or fields[0]!='/type/work':continue
            try:r=json.loads(fields[4])
            except json.JSONDecodeError:continue
            key=r.get('key') or fields[1]
            title=r.get('title','')
            if not title or key in seen:continue
            subjects=r.get('subjects') or []
            if not isinstance(subjects,list):subjects=[]
            hints=[norm(x) for x in subjects[:120] if isinstance(x,str)]
            # Explicit online-serialization cues only; exclude broad generic books.
            if not any(any(needle in h for needle in WORK_HINTS) for h in hints):continue
            seen.add(key)
            r_out=proposal('openlibrary',key,title,'','',
                'possibly web serial / edition unconfirmed',r.get('alternate_titles') or [],
                '','CC0','https://openlibrary.org'+key)
            if r_out:
                r_out['reviewIssues'].append('Open Library book/edition metadata is not proof of original web-serial identity')
                r_out['collisions']=collision(r_out['work'],series)
                found.append(r_out)
    return found,examined

def author_csv(file,series):
    rows=[]
    with _open_text(file) as f:
        for i,row in enumerate(csv.DictReader(f),2):
            if row.get('metadata_permission')!='yes':continue
            url=row.get('source_url','').strip()
            if not safe_link(url):continue
            r=proposal('author-submission','row:'+str(i),row.get('title',''),
                row.get('author',''),row.get('original_language',''),
                row.get('work_type','web serial'),row.get('aliases','').split('|'),
                url,'submitter-claimed-metadata-permission','author-submitted, not identity-verified')
            if r:
                r['reviewIssues'].append('Confirm identity/rights ownership before calling an author submission verified')
                r['collisions']=collision(r['work'],series)
                rows.append(r)
    return rows

def group_candidates(rows):
    seen=set();unique=[]
    for r in rows:
        k=(r['source'],r['sourceId'])
        if k in seen:continue
        seen.add(k);unique.append(r)
    return {'schema':SCHEMA,'automaticPublication':False,
        'note':'Facts and CC0 records proposed for manual review. No third-party fiction text, covers or scraped user ratings.',
        'counts':{'candidateRecords':len(unique),'sourceCounts':{
            name:sum(x['source']==name for x in unique) for name in sorted({x['source'] for x in unique})},
            'withSourceLinks':sum(bool(x['work']['sourceUrl']) for x in unique),
            'possibleExistingCollisions':sum(bool(x['collisions']['sameTitleOrAlias'] or x['collisions']['sameLegitimateSourceUrl']) for x in unique)},
        'proposals':unique}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--wikidata-json',type=Path)
    p.add_argument('--openlibrary-works',type=Path)
    p.add_argument('--author-csv',type=Path)
    p.add_argument('--max-records',type=int,default=200000)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    if a.max_records<1 or a.max_records>20000000:p.error('max-records out of range')
    series=json.loads((ROOT/'content/series_registry.json').read_text(encoding='utf-8'))['series']
    rows=[]
    if a.wikidata_json:
        rows+=wikidata_spaqrl(json.loads(a.wikidata_json.read_text(encoding='utf-8')),series)
    if a.openlibrary_works:
        entries,read=openlibrary_dump(a.openlibrary_works,series,a.max_records)
        print(f'Examined {read} Open Library dump rows; {len(entries)} cautiously selected',file=sys.stderr)
        rows+=entries
    if a.author_csv:rows+=author_csv(a.author_csv,series)
    if not rows:raise SystemExit('No eligible candidates. Supply actual permitted input; no fake records generated.')
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(group_candidates(rows),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Wrote quarantine proposals (NOT public records): '+str(a.out))

if __name__=='__main__':
    main()
