#!/usr/bin/env python3
"""Quarantine-to-public review gate. No scraping or automatic approvals."""
import argparse
from datetime import date,timedelta
import json
from pathlib import Path
import re
from urllib.parse import urlparse
import unicodedata

ROOT=Path(__file__).resolve().parents[1]
SCHEMA="novalume.publisher-review-decisions.v1"
PROVIDERS={
 "Fanqie":("fanqienovel.com",r"/page/\d{15,20}"),
 "Tadu":("www.tadu.com",r"/book/\d{3,12}"),
 "Wuxiaworld":("www.wuxiaworld.com",r"/novel/[a-z0-9-]+"),
 "Royal Road":("www.royalroad.com",r"/fiction/\d{1,15}/[a-z0-9-]+"),
 "Novel Updates":("www.novelupdates.com",r"/series/[a-z0-9-]+/")
}
STATUSES={"Completed","Ongoing","Discontinued","Unknown"}
GENRES={"Cultivation","Fantasy","System","Power Fantasy","Game System",
 "Summoning","Progression","Martial Arts","Regression","Xianxia","Xuanhuan",
 "Urban","Sci-Fi","Romance","Academy","Comedy","Time Loop","World Building",
 "Action","Historical","Mystery","Adventure","LitRPG"}
def norm(s):
 return re.sub(r"\s+"," ",unicodedata.normalize("NFKC",str(s or "")).strip().casefold())
def canonical(url,provider):
 if provider not in PROVIDERS:return False
 host,pattern=PROVIDERS[provider]
 try:u=urlparse(url)
 except (ValueError,TypeError):return False
 return bool(u.scheme=="https" and u.hostname==host and not u.username and not u.password
             and not u.query and not u.fragment and not u.params and re.fullmatch(pattern,u.path))
def validate_decision(d,c):
 if d.get("approved") is not True or d.get("workType")!="original-prose-serial":raise ValueError("Approval or prose identity missing")
 if d.get("candidateId")!=c.get("candidateId") or not re.fullmatch(r"pangudawn:\d{1,12}",str(d.get("candidateId",""))):
  raise ValueError("Candidate identity mismatch")
 if not isinstance(d.get("id"),str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*",d["id"]) or len(d["id"])>90:
  raise ValueError("Bad canonical novel ID")
 src=d.get("source") or {}
 if not canonical(src.get("url",""),src.get("provider","")):raise ValueError("Not an exact original work page")
 if src.get("pageType")!="work-page" or src.get("inspectionMethod")!="manual-publisher-page":
  raise ValueError("Manual source inspection required")
 if norm(src.get("confirmedTitle"))!=norm(c.get("title")):raise ValueError("Unmatched publisher title")
 if norm(src.get("confirmedAuthor"))!=norm(c.get("author")):raise ValueError("Unmatched publisher author")
 signals=c.get("qualitySignals") or {}
 if signals.get("authorPlaceholder") or signals.get("potentialNonNovelCategory"):
  raise ValueError("Low-quality candidate requires separate identity correction")
 if not isinstance(d.get("reviewer"),str) or not 3<=len(d["reviewer"])<=90:
  raise ValueError("Named reviewer required")
 try:when=date.fromisoformat(d["reviewedAt"])
 except (TypeError,ValueError,KeyError):raise ValueError("Invalid review date")
 if when>date.today()+timedelta(days=2):raise ValueError("Impossible future review date")
 summary=d.get("summary","")
 if not isinstance(summary,str) or not 35<=len(summary)<=295 or "<" in summary or ">" in summary:
  raise ValueError("Independently drafted short description required")
 if d.get("status") not in STATUSES:raise ValueError("Unsupported work status")
 gs=d.get("genres")
 if not isinstance(gs,list) or not 1<=len(gs)<=8 or any(g not in GENRES for g in gs):
  raise ValueError("Invalid genres")
 if d.get("textReuse")!="none" or d.get("coversReuse")!="none":
  raise ValueError("No chapters, descriptions, covers or copied reviews")
 return True
def review_batch(candidates,decisions,registry,evidence):
 if candidates.get("schema")!="novalume.cc0-webnovel-candidates.v1" or decisions.get("schema")!=SCHEMA:
  raise ValueError("Wrong candidate or decision schema")
 if registry.get("schema")!="novalume.external-series.v1" or evidence.get("schema")!="novalume.source-evidence.v1":
  raise ValueError("Wrong registry or source schema")
 candidates_by_id={c["candidateId"]:c for c in candidates["candidates"]}
 originals={x["id"]:x for x in registry["series"]}
 urls={x["sourceUrl"] for x in registry["series"]}
 identities={(norm(x["title"]),norm(x["author"])) for x in registry["series"]}
 rows=[];claims=[];seen=set();skipped=0
 for d in decisions["decisions"]:
  cid=d.get("candidateId")
  if cid in seen:raise ValueError("Same candidate decision twice")
  seen.add(cid)
  if cid not in candidates_by_id:raise ValueError("Unknown candidate")
  c=candidates_by_id[cid]
  validate_decision(d,c)
  old=originals.get(d["id"])
  if old:
   if old["sourceUrl"]==d["source"]["url"] and norm(old["title"])==norm(c["title"]) and norm(old["author"])==norm(c["author"]):
    skipped+=1;continue
   raise ValueError("Canonical ID already used by another novel")
  identity=(norm(c["title"]),norm(c["author"]))
  if identity in identities:raise ValueError("Same title and author already registered")
  if d["source"]["url"] in urls:raise ValueError("Duplicate publisher URL")
  source=d["source"];id_=d["id"]
  row={"id":id_,"title":c["title"],"author":c["author"],
   "originalLanguage":"Chinese","sourcePlatform":source["provider"],"sourceUrl":source["url"],
   "workStatus":d["status"],"genres":d["genres"],"aliases":c.get("aliases",[])[:12],
   "summary":d["summary"],"kind":"external-index","verifiedAt":d["reviewedAt"],
   "rank":len(registry["series"])+len(rows)+1,"availabilityStatus":"Check source",
   "sourcePolicy":"manual-facts-and-editorial-summary","sourceAudit":"publisher-page-reviewed",
   "candidateOrigin":cid}
  claim={"seriesId":id_,"provider":source["provider"],"sourceUrl":source["url"],
   "observedAt":d["reviewedAt"],"sourceKind":"licensed-publisher",
   "reusePolicy":"manual-facts-and-link-only",
   "claims":{"title":c["title"],"author":c["author"],"originalLanguage":"Chinese","workStatus":d["status"]}}
  rows.append(row);claims.append(claim)
  originals[id_]=row;urls.add(source["url"]);identities.add(identity)
 return {"added":len(rows),"alreadyPresent":skipped,"records":rows,"claims":claims}
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--candidates",required=True,type=Path)
 p.add_argument("--decisions",required=True,type=Path)
 p.add_argument("--registry",type=Path,default=ROOT/"content/series_registry.json")
 p.add_argument("--evidence",type=Path,default=ROOT/"content/series_evidence.json")
 p.add_argument("--output-directory",type=Path)
 p.add_argument("--apply",action="store_true")
 a=p.parse_args()
 load=lambda path:json.loads(path.read_text(encoding="utf8"))
 registry,evidence=load(a.registry),load(a.evidence)
 out=review_batch(load(a.candidates),load(a.decisions),registry,evidence)
 print("Reviewed new works:",out["added"],"already published:",out["alreadyPresent"])
 if not a.apply:
  print("DRY RUN; no public catalogue changed")
  return
 if not a.output_directory:raise SystemExit("--apply requires --output-directory")
 a.output_directory.mkdir(parents=True,exist_ok=True)
 registry["series"]+=out["records"];evidence["claims"]+=out["claims"]
 registry["checkedAt"]=evidence["reviewDate"]=str(date.today())
 (a.output_directory/"series_registry.json").write_text(json.dumps(registry,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 (a.output_directory/"series_evidence.json").write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 print("Reviewed outputs staged; NOT deployed automatically")
if __name__=="__main__":main()
