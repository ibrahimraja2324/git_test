#!/usr/bin/env python3
"""Create separate UNVERIFIED title leads from a pinned CC0-claimed snapshot.

Basic candidate titles/author strings are not confirmed originals, and we
never include protected descriptions, images, chapters, ratings or source URLs.
"""
import argparse
import json
from pathlib import Path
import re
import unicodedata

ROOT=Path(__file__).resolve().parents[1]
SOURCE="https://github.com/HeTaobaba123/arabic-chinese-novels-dataset/releases/tag/v1.0.0"
SCHEMA="novalume.unverified-title-leads.v1"
CHINESE=re.compile(r"[\u4e00-\u9fff]")
NOISE=re.compile(r"۞|---|\.{3,}|\d{1,5}\s*[-—–]\s*\d{1,5}|^\s*[\"“”‘’\-\d]|[。；;]|\b(?:txt|epub)\b|(?:\.com|\.cn|\.net|网址|下载|无弹窗|正文|小说网|阅读网|独家)|第\s*[0-9一二三四五六七八九十百千]+\s*[章节回]|\(ohx\)",re.I)
def norm(value):
 return re.sub(r"\s+"," ",unicodedata.normalize("NFKC",str(value or "")).casefold().strip())
def build(snapshot,verified):
 if snapshot.get("schema")!="novalume.cc0-webnovel-candidates.v1" or snapshot.get("datasetSource")!=SOURCE:
  raise ValueError("Unrecognized candidate snapshot")
 if verified.get("schema")!="novalume.external-series.v1":raise ValueError("Unrecognized verified catalogue")
 already={w.get("candidateOrigin") for w in verified["series"]}
 rows=[];seen=set()
 for c in snapshot["candidates"]:
  if c.get("state")!="quarantine" or c.get("verifiedOriginalWork") is not False:
   raise ValueError("Unexpected candidate verification state")
  s=c.get("qualitySignals") or {}
  if s.get("authorPlaceholder") or s.get("potentialNonNovelCategory"):continue
  id_,title,author=c.get("candidateId"),c.get("title"),c.get("author")
  if not isinstance(id_,str) or not re.fullmatch(r"pangudawn:\d{1,12}",id_) or id_ in already:continue
  if not isinstance(title,str) or not isinstance(author,str):continue
  if not (2<=len(title)<=110 and 2<=len(author)<=120 and CHINESE.search(title)):continue
  if NOISE.search(title) or any(ord(z)<32 for z in title+author):continue
  if author.startswith("عذراً") or "لا أستطيع" in author:continue
  key=(norm(title),norm(author))
  if key in seen:continue
  seen.add(key)
  rows.append({"id":id_,"title":title,"author":author,"categoryHint":str(c.get("categoryHint") or "Unknown")[:48]})
 rows.sort(key=lambda z:(z["title"].casefold(),z["id"]))
 return {"schema":SCHEMA,"source":SOURCE,
   "warning":"UNVERIFIED research leads. No canonical original work links, source verification, covers, chapters or ratings.",
   "totalCandidates":len(snapshot["candidates"]),"leads":rows}
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--input",required=True,type=Path)
 p.add_argument("--out",required=True,type=Path)
 a=p.parse_args()
 data=build(json.loads(a.input.read_text(encoding="utf8")),json.loads((ROOT/"content/series_registry.json").read_text(encoding="utf8")))
 if not 3000<=len(data["leads"])<=5000:raise SystemExit("Unexpected count; manual audit required")
 a.out.parent.mkdir(parents=True,exist_ok=True)
 a.out.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
 print(f"Research leads (NOT verified works): {len(data['leads'])}")
if __name__=="__main__":main()
