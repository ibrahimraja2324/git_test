#!/usr/bin/env python3
"""Import one individually approved Standard Ebooks edition from its upstream Git source.
Uses one GitHub archive download per edition rather than bulk hotlinking ebooks.
Network required. This tool never changes the legal decision to approved.
"""
import argparse, hashlib, io, json, posixpath, re, urllib.request, zipfile
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
MAX_ARCHIVE_BYTES=25_000_000
class ChapterParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts=[];self._stack=[];self._current=[];self._capture=None;self.title='';self._ignore=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ('script','style','nav') or (tag in ('section','aside') and 'footnotes' in a.get('class','')):
            self._ignore+=1
        if self._ignore:return
        if tag in ('p','h1','h2','h3','h4','blockquote') and self._capture is None:
            self._capture=tag;self._current=[]
        elif tag=='br' and self._capture:
            self._current.append(' ')
    def handle_data(self,data):
        if not self._ignore and self._capture:self._current.append(data)
    def handle_endtag(self,tag):
        if self._ignore:
            if tag in ('script','style','nav','section','aside'):self._ignore=max(0,self._ignore-1)
            return
        if tag==self._capture:
            value=re.sub(r'\s+',' ',''.join(self._current)).strip()
            if value:
                if tag in ('h1','h2','h3','h4') and not self.title:self.title=value
                elif tag in ('p','blockquote'):self.parts.append(value)
            self._capture=None;self._current=[]
def extract_chapter(source):
    parser=ChapterParser();parser.feed(source)
    return {'title':parser.title,'paragraphs':parser.parts}
def ordered_chapter_paths(z):
    """Respect EPUB reading order from the OPF spine; fail closed on invalid source.

    Standard Ebooks source repositories contain src/epub/content.opf, whose spine
    is the authoritative order. Filesystem/natural sorting silently scrambles some
    multi-part works (chapter-1 from each part can collide), so no fallback.
    """
    names=set(z.namelist())
    opfs=[n for n in names if n.endswith('/src/epub/content.opf')]
    if len(opfs)!=1:raise ValueError('Expected exactly one source EPUB content.opf')
    opf=opfs[0]
    try:root=ET.fromstring(z.read(opf))
    except ET.ParseError as exc:raise ValueError('Invalid EPUB content.opf') from exc
    manifest={e.get('id'):e.get('href') for e in root.findall('.//{*}manifest/{*}item')}
    spine=[e.get('idref') for e in root.findall('.//{*}spine/{*}itemref')]
    if not manifest or not spine:raise ValueError('Missing OPF manifest or spine')
    base=posixpath.dirname(opf);eligible=[];seen=set()
    for item_id in spine:
        href=manifest.get(item_id)
        if not href:raise ValueError(f'OPF spine references missing manifest item {item_id!r}')
        href=href.split('#',1)[0]
        if not href.lower().endswith('.xhtml'):continue
        name=posixpath.normpath(posixpath.join(base,href))
        if not name.startswith(base+'/') or name not in names:
            raise ValueError(f'Unsafe or unavailable OPF spine entry: {href}')
        filename=posixpath.basename(name)
        if not re.fullmatch(r'(?:chapter|part|book|story|prologue|epilogue)(?:[-_][a-z0-9_.-]+)?\.xhtml',filename,re.I):
            continue
        if name in seen:raise ValueError(f'Duplicate OPF spine entry: {name}')
        seen.add(name);eligible.append(name)
    if not eligible:raise ValueError('No chapter XHTML files identified in OPF spine; manual review required')
    return eligible

def ingest(item,force=False):
    rights=item['rights']
    if rights['decision']!='approved' or not rights.get('reviewer') or not rights.get('reviewedAt'):
        raise ValueError(f"{item['id']} is not approved for republishing; blocked by rights gate")
    if item.get('translation') and not rights.get('translationCleared'):
        raise ValueError(f"{item['id']} has uncleared translation rights")
    repo=item.get('standardEbooksRepo')
    if not repo or not re.fullmatch(r'[a-z0-9_.-]+',repo):raise ValueError('Invalid upstream repository')
    url=f'https://codeload.github.com/standardebooks/{repo}/zip/refs/heads/master'
    print('Fetching',url)
    req=urllib.request.Request(url,headers={'User-Agent':'NovalumeRightsReviewImporter/0.1'})
    with urllib.request.urlopen(req,timeout=50) as resp:
        archive=resp.read(MAX_ARCHIVE_BYTES+1)
    if len(archive)>MAX_ARCHIVE_BYTES:raise ValueError('Archive size limit exceeded')
    digest=hashlib.sha256(archive).hexdigest()
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        eligible=ordered_chapter_paths(z)
        chapters=[]
        for name in eligible:
            parsed=extract_chapter(z.read(name).decode('utf-8'))
            if len(' '.join(parsed['paragraphs']))<80:continue
            parsed['title']=parsed['title'] or 'Chapter '+str(len(chapters)+1)
            chapters.append(parsed)
        if not chapters:raise ValueError('No meaningful chapter text extracted')
    target=ROOT/'public'/'data'/'books'/f"{item['id']}.json"
    if target.exists() and not force:raise FileExistsError('Edition already imported; use --force after reviewing changes')
    target.parent.mkdir(parents=True,exist_ok=True)
    payload={'id':item['id'],'sourceRepo':f'standardebooks/{repo}','sourceArchiveSha256':digest,
             'rightsReview':{'reviewer':rights['reviewer'],'reviewedAt':rights['reviewedAt']},
             'chapters':chapters}
    target.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Imported {item['title']}: {len(chapters)} chapters; archive sha256={digest}")
    return target
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('id');p.add_argument('--force',action='store_true');a=p.parse_args()
    manifest=json.loads((ROOT/'content'/'rights_manifest.json').read_text(encoding='utf-8'))
    matches=[x for x in manifest if x['id']==a.id]
    if not matches:raise SystemExit('Edition not found in rights manifest')
    ingest(matches[0],a.force)
