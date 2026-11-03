#!/usr/bin/env python3
"""Build published discovery index from edition-specific rights manifest and hosted assets.
No copyright status is inferred from age alone. Unreviewed records remain external listings.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'content'/'rights_manifest.json'
OUT=ROOT/'public'/'data'/'catalog.json'
def build():
    items=json.loads(SOURCE.read_text(encoding='utf-8'))
    catalog=[]
    seen=set()
    for item in items:
        assert item['id'] not in seen, f"Duplicate ID: {item['id']}"
        seen.add(item['id'])
        path=ROOT/'public'/'data'/'books'/f"{item['id']}.json"
        ready=item['rights']['decision']=='approved' and path.is_file()
        chapters=0
        if ready:
            payload=json.loads(path.read_text(encoding='utf-8'))
            chapters=len(payload['chapters'])
            assert chapters>0, f"Approved book has zero chapters: {item['id']}"
        catalog.append({
          'id':item['id'],'title':item['title'],'author':item['author'],
          'genre':item['genre'],'blurb':item['blurb'],'tags':item['tags'],
          'storySignals':item['storySignals'],'colors':item['colors'],
          'mark':item['mark'],'featured':item['featured'],'sourceUrl':item['sourceUrl'],
          'status':'ready' if ready else 'external','chapterCount':chapters,
          'license':{'type':'PUBLIC-DOMAIN-CANDIDATE' if item['rights']['decision']!='approved' else 'REVIEWED-PUBLIC-DOMAIN',
                     'note':item['rights']['notes'] if ready else 'External listing only. Text not hosted until an edition-specific review is approved.'}
        })
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Wrote {len(catalog)} discovery records; {sum(b["status"]=="ready" for b in catalog)} hosted editions.')
if __name__=='__main__':build()
