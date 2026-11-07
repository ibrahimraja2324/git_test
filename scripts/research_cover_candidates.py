#!/usr/bin/env python3
"""One-time, rate-limited Open Library *metadata* discovery, never crawl cover images.

Outputs a REVIEW-ONLY proposal file. Not included in the deployed catalogue.
No automated cover promotion, third-party chapter scraping or provider-image download.
"""
import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT=Path(__file__).resolve().parents[1]
REGISTRY=ROOT/'content/series_registry.json'
OUTPUT=ROOT/'ops/cover-research-candidates.json'
FIELDS="key,title,author_name,cover_i,edition_key,first_publish_year"
API="https://openlibrary.org/search.json"

def normalize(s):
    s=unicodedata.normalize('NFKC',str(s or '')).casefold()
    return re.sub(r'[^a-z0-9]+','',s)

def title_ok(expected, actual):
    a=normalize(expected)
    b=normalize(actual)
    if not a or not b: return False
    if a==b:return True
    # Book one and edition subtitles are eligible, NOT a book 2+ sequel.
    extra=str(actual).casefold()
    if extra.startswith(str(expected).casefold()) and (
      'book one' in extra or 'book 1' in extra or 'volume 1' in extra
      or 'vol. 1' in extra or 'an isekai' in extra or 'a litrpg' in extra):
      return True
    return False

def author_ok(expected, authors):
    normalized=normalize(str(expected).split('(')[0])
    if not normalized or len(normalized)<3:return False
    return any(normalize(author)==normalized or
               (normalized in normalize(author) and len(normalized)>=7)
               for author in (authors or []))

def eligible(doc,work):
    if not isinstance(doc,dict):return False
    cover=doc.get('cover_i')
    key=doc.get('key')
    return (isinstance(cover,int) and cover>0 and
      isinstance(key,str) and re.fullmatch(r'/works/OL\d+W',key) is not None and
      title_ok(work['title'],doc.get('title','')) and
      author_ok(work['author'],doc.get('author_name',[])))

def lookup(work):
    params=urlencode({'title':work['title'],'author':str(work['author']).split('(')[0],
                      'limit':8,'fields':FIELDS})
    url=API+'?'+params
    for attempt in range(2):
        try:
            req=Request(url,headers={'User-Agent':'NovalumeEditorialResearch/1.0 (one-time cover metadata QA; github.com/ibrahimraja2324/git_test)','Accept':'application/json'})
            with urlopen(req,timeout=18) as stream:
                data=json.load(stream)
            docs=data.get('docs',[])
            return [dict(workId=work['id'],workTitle=work['title'],canonicalAuthor=work['author'],
              openLibraryTitle=d['title'],openLibraryAuthors=d.get('author_name',[]),
              coverId=d['cover_i'],workUrl='https://openlibrary.org'+d['key'],
              editionCandidates=d.get('edition_key',[])[:3],
              reviewStatus='pending-editorial-verification') for d in docs if eligible(d,work)]
        except (HTTPError,URLError,TimeoutError,ValueError,OSError) as err:
            if attempt==1:return [{'workId':work['id'],'error':type(err).__name__,'message':str(err)[:80]}]
            time.sleep(2)
    return []

def main():
    registry=json.loads(REGISTRY.read_text(encoding='utf8'))
    total=registry['series']
    # Specific constraint: do not turn Open Library into an ongoing Novalume data backend.
    # At most one non-cover metadata lookup per English original; no image download.
    candidates=[];errors=[];checked=0
    for work in total:
        if work['originalLanguage']!='English' or work.get('coverArt'):continue
        found=lookup(work)
        checked+=1
        for item in found:
            if 'error' in item:errors.append(item)
            else:candidates.append(item)
        print(f"researched {checked}: {work['id']} => {len(found)} candidates",flush=True)
        time.sleep(1.2) # Respect documented 1 request/sec non-identified API guidance.
    output={'schema':'novalume.cover-research-proposals.v1',
      'disclaimer':'Review leads only; source work/edition image must be checked before publishing. No downloaded cover files.',
      'existingCoverRecords':sum(bool(s.get('coverArt')) for s in total),
      'totalCanonicalSeries':len(total),
      'englishUncoveredResearched':checked,
      'proposals':candidates,'errors':errors}
    OUTPUT.parent.mkdir(exist_ok=True,parents=True)
    OUTPUT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({k:len(v) if isinstance(v,list) else v for k,v in output.items() if k!='disclaimer'}))
    return 0 if checked>0 else 1

if __name__=='__main__':sys.exit(main())
