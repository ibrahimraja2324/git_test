#!/usr/bin/env python3
"""Build a rights-gated deployable static artifact without runtime infrastructure.

Important: a revoked hosted title must NOT ship in dist, even if a stale local
source asset persists. No raw author or draft content is copied to public output.
"""
from pathlib import Path
import json
import shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
PUBLIC=ROOT/'public'/'data'


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copy2(ROOT/'index.html',OUT/'index.html')
    shutil.copytree(ROOT/'src',OUT/'src',ignore=shutil.ignore_patterns('*.test.js'))
    (OUT/'data'/'books').mkdir(parents=True)
    from test_series_registry import validate_registry
    directory=json.loads((ROOT/'content/series_registry.json').read_text(encoding='utf-8'))
    validate_registry(directory)
    from fuse_series_metadata import build_registry
    (OUT/'data'/'series_registry.json').write_text(json.dumps(build_registry(),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for name in ('catalog.json','story_index.json'):
        shutil.copy2(PUBLIC/name, OUT/'data'/name)
    catalog=json.loads((PUBLIC/'catalog.json').read_text(encoding='utf-8'))
    indexed=json.loads((PUBLIC/'story_index.json').read_text(encoding='utf-8'))['books']
    for book in catalog:
        if book['status']!='ready':
            continue
        name=f"{book['id']}.json"
        if book['id'] not in indexed:
            raise ValueError(f'Approved book lacks deterministic index: {name}')
        for folder in ('books',):
            file=PUBLIC/folder/name
            if not file.is_file():
                raise FileNotFoundError(file)
            shutil.copy2(file,OUT/'data'/folder/name)
    print('Static site built with approved books only; all other book assets excluded.')

if __name__=='__main__':
    build()
