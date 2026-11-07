#!/usr/bin/env python3
"""Combine manually reviewed factual source claims. Never copy novel content or crawl sites."""
from __future__ import annotations
from collections import defaultdict
from copy import deepcopy
from pathlib import Path
from urllib.parse import urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SAFE = {'title','author','originalLanguage','workStatus'}
ALLOWED = {
    'Wuxiaworld':'www.wuxiaworld.com',
    'Novel Updates':'www.novelupdates.com',
    'Royal Road':'www.royalroad.com',
    'Wikidata':'www.wikidata.org',
    'Open Library':'openlibrary.org',
    'Fanqie':'fanqienovel.com',
    'Tadu':'www.tadu.com'
}
STATUSES = {'Completed','Ongoing','Discontinued','Unknown'}


def normalize(value):
    return re.sub(r'\s+',' ',str(value).casefold().strip())


def validate_sources(evidence, ids):
    if evidence.get('schema')!='novalume.source-evidence.v1':
        raise ValueError('Invalid evidence schema')
    seen=set()
    for item in evidence.get('claims',[]):
        id_, provider=item.get('seriesId'),item.get('provider')
        if id_ not in ids or provider not in ALLOWED:
            raise ValueError('Unrecognised ID or source')
        url=urlparse(item.get('sourceUrl',''))
        if url.scheme!='https' or url.hostname!=ALLOWED[provider] or url.username or url.password:
            raise ValueError('Untrusted source URL')
        key=(id_,provider,item['sourceUrl'])
        if key in seen:
            raise ValueError('Duplicated source record')
        seen.add(key)
        if item.get('reusePolicy')!='manual-facts-and-link-only':
            raise ValueError('Uncleared reuse method')
        if item.get('sourceKind') not in ('licensed-publisher','community-index','author-hosting-platform','cc0-source'):
            raise ValueError('Source type not approved')
        if not re.fullmatch(r'20\d\d-\d\d-\d\d',item.get('observedAt','')):
            raise ValueError('Missing review timestamp')
        facts=item.get('claims') or {}
        if not facts or set(facts)-SAFE:
            raise ValueError('Unsupported facts (may be copyrighted content)')
        for key,val in facts.items():
            if not isinstance(val,str) or not val.strip() or len(val)>170:
                raise ValueError('Invalid factual claim')
            if key=='workStatus' and val not in STATUSES:
                raise ValueError('Invalid work completion status')
            if key=='originalLanguage' and val not in ('Chinese','Korean','English'):
                raise ValueError('Invalid language')
    return True


def fuse(records,evidence):
    by_id={x['id']:deepcopy(x) for x in records}
    if len(by_id)!=len(records):
        raise ValueError('Duplicate Novalume ID')
    validate_sources(evidence,set(by_id))
    grouped=defaultdict(list)
    for claim in evidence['claims']:
        grouped[claim['seriesId']].append(claim)
    for item in by_id.values():
        source=grouped.get(item['id'],[])
        item['sourceCount']=len(set(x['provider'] for x in source))
        item['sourceReferences']=[
            {'name':x['provider'],'url':x['sourceUrl'],'observedAt':x['observedAt']}
            for x in source
        ]
        item['fieldEvidence']={}
        item['sourceDisagreements']=[]
        for key in SAFE:
            claims=[(x['provider'],x['claims'][key]) for x in source if key in x['claims']]
            if not claims:continue
            item['fieldEvidence'][key]=[{'provider':p,'value':v} for p,v in claims]
            if len({normalize(v) for _,v in claims})>1:
                item['sourceDisagreements'].append(key)
                if key=='workStatus':item[key]='Unknown'
            elif len(set(p for p,_ in claims))>=2 and key=='workStatus':
                item[key]=claims[0][1]
        item['sourceConfidence']=(
            'Sources disagree' if item['sourceDisagreements'] else
            'Cross-checked' if item['sourceCount']>=2 else
            'One reviewed source' if item['sourceCount']==1 else
            'Independent source check pending'
        )
    return list(by_id.values())


def build_registry():
    from test_series_registry import validate_registry
    catalog=json.loads((ROOT/'content/series_registry.json').read_text(encoding='utf-8'))
    validate_registry(catalog)
    evidence=json.loads((ROOT/'content/series_evidence.json').read_text(encoding='utf-8'))
    rows=fuse(catalog['series'],evidence)
    return {**catalog,'fusedAt':evidence['reviewDate'],'series':rows,
      'coverage':{
        'total':len(rows),
        'multiSource':sum(x['sourceCount']>=2 for x in rows),
        'singleSource':sum(x['sourceCount']==1 for x in rows),
        'needsReview':sum(x['sourceCount']==0 for x in rows),
        'conflicts':sum(bool(x['sourceDisagreements']) for x in rows)
      }
    }


if __name__=='__main__':
    print(json.dumps(build_registry(),ensure_ascii=False,indent=2))
