#!/usr/bin/env python3
"""Private, exhaustive FTS5 passage index, containing *every* reviewed paragraph.

Unlike ranked story descriptors, this has NO phrase list or taxonomy size cap.
FTS index and source passages stay server-side. This is an early single-node
snapshot; production growth should move to a durable, access-controlled index.
"""
from pathlib import Path
import hashlib,json,sqlite3,sys
from dynamic_narrative import ROOT,normalize

DB=ROOT/'server/private/narrative.sqlite'

def build():
    manifest=json.loads((ROOT/'content/rights_manifest.json').read_text())
    DB.parent.mkdir(parents=True,exist_ok=True)
    if DB.exists():DB.unlink()
    cx=sqlite3.connect(DB)
    cx.execute("CREATE VIRTUAL TABLE passage_fts USING fts5(book_id UNINDEXED, chapter UNINDEXED, paragraph UNINDEXED, content, tokenize='unicode61 remove_diacritics 2')")
    cx.execute('CREATE TABLE source_provenance (book_id TEXT PRIMARY KEY, sha256 TEXT NOT NULL, paragraph_count INTEGER NOT NULL)')
    count=0
    for r in manifest:
        path=ROOT/'public/data/books'/f"{r['id']}.json"
        if r['rights']['decision']!='approved' or not path.is_file():continue
        raw=path.read_bytes()
        payload=json.loads(raw)
        rows=[(r['id'],chnum,pnum,normalize(para)) for chnum,ch in enumerate(payload['chapters'],1)
              for pnum,para in enumerate(ch.get('paragraphs',[]),1) if len(normalize(para))>=20]
        cx.executemany('INSERT INTO passage_fts(book_id,chapter,paragraph,content) VALUES(?,?,?,?)',rows)
        cx.execute('INSERT INTO source_provenance VALUES (?,?,?)',(r['id'],hashlib.sha256(raw).hexdigest(),len(rows)))
        count+=len(rows)
    cx.commit();cx.close()
    print('FTS5 private passages:',count,'(all qualifying source paragraphs, no capped vocabulary)')

def search(query, limit=15, db=DB):
    import re
    terms=[t for t in re.findall(r'[\w]+',query.lower()) if len(t)>2][:15]
    if not terms:return []
    fts=' OR '.join('"'+t.replace('"','')+'"' for t in terms)
    cx=sqlite3.connect(f'file:{db}?mode=ro',uri=True)
    try:
        rows=cx.execute('SELECT book_id,chapter,paragraph,round(bm25(passage_fts),3) FROM passage_fts WHERE passage_fts MATCH ? ORDER BY bm25(passage_fts) LIMIT ?', (fts,limit)).fetchall()
        return [{'bookId':r[0],'chapter':int(r[1]),'paragraph':int(r[2]),'score':r[3]} for r in rows]
    finally:cx.close()

if __name__=='__main__':build()
