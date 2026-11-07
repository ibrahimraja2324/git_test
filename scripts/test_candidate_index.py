import unittest
from build_candidate_index import build,SCHEMA,SOURCE

def row(id_,title,author,**flags):
 return {"candidateId":"pangudawn:"+id_,"title":title,"author":author,"state":"quarantine",
  "verifiedOriginalWork":False,"categoryHint":"Cultivation",
  "qualitySignals":{"authorPlaceholder":False,"potentialNonNovelCategory":False,**flags}}
class CandidateIndexTests(unittest.TestCase):
 def test_records_never_promote_or_embed_books(self):
  src={"schema":"novalume.cc0-webnovel-candidates.v1","datasetSource":SOURCE,
   "candidates":[row("1","魔法学徒","甲乙"),row("2","魔法学徒","甲乙"),row("3","系统修真","Unknown",authorPlaceholder=True),
    row("4","古代诗歌","诗人",potentialNonNovelCategory=True),row("5","龙的冒险 1---192","丁戊"),row("6","大家好","测试")]}
  approved={"schema":"novalume.external-series.v1","series":[{"candidateOrigin":"pangudawn:6"}]}
  out=build(src,approved)
  self.assertEqual(out["schema"],SCHEMA)
  self.assertEqual(len(out["leads"]),1)
  self.assertEqual(out["leads"][0]["id"],"pangudawn:1")
  for forbidden in ("sourceUrl","description","summary","cover","chapters","ratings"):
   self.assertNotIn(forbidden,out["leads"][0])
 def test_fails_closed_if_dataset_claims_verified_facts(self):
  src={"schema":"novalume.cc0-webnovel-candidates.v1","datasetSource":SOURCE,
   "candidates":[{**row("1","魔法学徒","甲乙"),"verifiedOriginalWork":True}]}
  with self.assertRaises(ValueError):build(src,{"schema":"novalume.external-series.v1","series":[]})
