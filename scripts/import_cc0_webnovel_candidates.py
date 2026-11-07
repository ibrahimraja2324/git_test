#!/usr/bin/env python3
"""Stage CC0-claimed webnovel catalogue identity candidates from a local snapshot.

Never republishes the upstream publisher's chapter text, descriptions, covers,
engagement numbers or translations. A dataset's CC0 claim only covers rights
its distributor actually owns; original publisher/author identities still
require review. No platform URLs are invented or auto-published.
"""
import argparse
import gzip
import json
from pathlib import Path
import re
import unicodedata

SCHEMA='novalume.cc0-webnovel-candidates.v1'
SOURCE='https://github.com/HeTaobaba123/arabic-chinese-novels-dataset/releases/tag/v1.0.0'
CATEGORY={
 '修仙':'Cultivation','玄幻':'Fantasy','都市':'Urban','历史':'Historical',
 '科幻':'Science Fiction','武侠':'Martial Arts','言情':'Romance',
 '游戏':'Gaming','灵异':'Supernatural','军事':'Military'
}

def normal(text):
    return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',str(text or '')).strip()).casefold()

def safe_text(value,limit=180):
    text=re.sub(r'[\x00-\x1f\x7f]',' ',str(value or '')).strip()
    return re.sub(r'\s+',' ',text)[:limit].strip()

def convert(records):
    """Return identity proposals, never public registry records."""
    if isinstance(records,dict):
        records=records.get('novels') or records.get('data') or records.get('items')
    if not isinstance(records,list):
        raise ValueError('Expected an array or a novels/data/items array')
    candidates=[];rejected=[];known=set();claimed=0
    for r in records:
        if not isinstance(r,dict):
            rejected.append('invalid-object');continue
        rid=r.get('id')
        if not isinstance(rid,(int,str)) or not re.fullmatch(r'[0-9]{1,12}',str(rid)):
            rejected.append('missing-source-id');continue
        title=safe_text(r.get('title'))
        author=safe_text(r.get('author'),120)
        # Upstream sometimes puts "by <author>" into title; avoid duplicates.
        if author and title.endswith(' by '+author):
            title=title[:-(len(author)+4)].rstrip()
        if not title or not author:
            rejected.append('missing-title-or-author');continue
        key=(normal(title),normal(author))
        if key in known:
            rejected.append('same-title-and-author');continue
        known.add(key)
        lang=normal(r.get('language'))
        if lang not in ('zh','chinese','zh-cn','zh-hans'):
            rejected.append('not-a-confirmed-chinese-work');continue
        claimed+=1
        aliases=[]
        en=safe_text(r.get('title_en'))
        if en and normal(en)!=normal(title) and not re.search(r'[\u4e00-\u9fff]',en):
            aliases=[en]
        category=safe_text(r.get('category'),60)
        candidates.append({
          'candidateId':'pangudawn:'+str(rid),'title':title,'author':author,
          'aliases':aliases,'originalLanguage':'Chinese',
          'categoryHint':CATEGORY.get(category,category),
          'sourceDataset':SOURCE,
          'datasetLicenceClaim':'CC0-1.0 (claimed by data uploader; verify provenance)',
          'verifiedOriginalWork':False,
          'officialSourceUrl':None,
          'publicationStatus':'Unknown',
          'state':'quarantine',
          'reviewIssues':['Confirm original novel and Chinese author identity',
                          'Find a legitimate original or publisher-hosted reading URL',
                          'Verify distributor controlled any claimed original descriptions',
                          'Independently check work/translation/adaptation identity'],
          'publicationReady':False
        })
    return {'schema':SCHEMA,'datasetSource':SOURCE,
      'notice':'Candidate metadata for identity review only. No chapters, copied descriptions, artwork, ratings or audience metrics.',
      'inputRows':len(records),'acceptedCandidates':len(candidates),
      'rejectedRows':len(rejected),'rejectionReasons':dict((k,rejected.count(k)) for k in set(rejected)),
      'candidates':candidates}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--snapshot',type=Path,required=True)
    ap.add_argument('--output',type=Path,required=True)
    args=ap.parse_args()
    if args.snapshot.suffix=='.gz':
        with gzip.open(args.snapshot,'rt',encoding='utf8') as f:input_=json.load(f)
    else:input_=json.loads(args.snapshot.read_text(encoding='utf8'))
    result=convert(input_)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('Quarantined',result['acceptedCandidates'],'candidate identities. Published: 0. No links or ownership assertions invented.')

if __name__=='__main__':main()
