#!/usr/bin/env python3
"""Turn CC0 Wikidata query exports into REVIEW PROPOSALS, never a live published scrape.

Input: local SPARQL JSON response downloaded separately from query.wikidata.org.
Wikidata facts are CC0, but a QID may identify a film/anime rather than a novel.
No network call, API dependency, or auto-publication to Novalume.
"""
from __future__ import annotations
from pathlib import Path
import json,re,sys,unicodedata
from urllib.parse import urlparse

WORK_CLASSES={'novel','web novel','novel series','book series','literary work','web fiction'}
LANGUAGES={'chinese':'Chinese','korean':'Korean','english':'English'}
PUBLISHED={'fiction','novel','web novel','book series','novel series'}


def clean(text):
    text=unicodedata.normalize('NFKC',str(text))
    return re.sub(r'[^\w]+',' ',text.casefold()).strip()


def value(binding,key):
    field=binding.get(key)
    return field.get('value','').strip() if isinstance(field,dict) else ''


def match_candidates(title,author,series):
    matches=[]
    t=clean(title);a=clean(author)
    for book in series:
        names=[book['title'],*(book.get('aliases') or [])]
        if not any(clean(name)==t for name in names):
            continue
        if not a or clean(book['author'])!=a:
            # Similar titles with different writers must be reviewed manually.
            matches.append({'id':book['id'],'quality':'title-only'})
        else:
            matches.append({'id':book['id'],'quality':'title-and-author'})
    return matches


def propose_wikidata_export(result,series):
    rows=result.get('results',{}).get('bindings')
    if not isinstance(rows,list):
        raise ValueError('Expected Wikidata SPARQL JSON response')
    suggestions=[];rejected=[]
    for binding in rows:
        url=value(binding,'item')
        parsed=urlparse(url)
        qid=parsed.path.rsplit('/',1)[-1]
        if parsed.hostname!='www.wikidata.org' or not re.fullmatch(r'Q[1-9]\d*',qid):
            rejected.append({'reason':'not-a-Wikidata-entity'});continue
        title=value(binding,'itemLabel')
        kind=clean(value(binding,'workTypeLabel'))
        author=value(binding,'authorLabel')
        language=LANGUAGES.get(clean(value(binding,'languageLabel')))
        if kind not in WORK_CLASSES:
            # Reject adaptation collisions: animation, movie, drama, comics.
            rejected.append({'qid':qid,'reason':'not-a-confirmed-original-literary-work','type':kind});continue
        if not title or re.fullmatch(r'Q\d+',title):
            rejected.append({'qid':qid,'reason':'no-text-label'});continue
        fields={'title':title}
        if author and not re.fullmatch(r'Q\d+',author):fields['author']=author
        if language:fields['originalLanguage']=language
        matches=match_candidates(title,fields.get('author',''),series)
        if len(matches)==1 and matches[0]['quality']=='title-and-author':
            review='existing-exact-candidate'
        else:
            review='manual-identity-review'
        suggestions.append({
            'qid':qid,'sourceUrl':'https://www.wikidata.org/wiki/'+qid,
            'license':'Wikidata CC0 structured data',
            'claims':fields,
            'identityMatches':matches,
            'decision':'quarantine',
            'reviewReason':review,
            'sourceType':kind
        })
    return {'schema':'novalume.cc0-proposals.v1','proposed':suggestions,'rejected':rejected,
            'policy':'Human-review proposals only; no automatic public launch or copyrighted prose import.'}


def main():
    if len(sys.argv)!=2:
        raise SystemExit('Usage: python3 scripts/propose_wikidata.py /path/to/sparql-export.json')
    input_=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    root=Path(__file__).resolve().parents[1]
    catalog=json.loads((root/'content'/'series_registry.json').read_text(encoding='utf-8'))['series']
    print(json.dumps(propose_wikidata_export(input_,catalog),indent=2,ensure_ascii=False))


if __name__=='__main__':
    main()
