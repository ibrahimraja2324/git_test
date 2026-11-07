import unittest
from datetime import date
from promote_reviewed_novels import validate_decision,review_batch,SCHEMA
C={"schema":"novalume.cc0-webnovel-candidates.v1","candidates":[
 {"candidateId":"pangudawn:15820","title":"玄幻：开局一座天机阁","author":"三尺青锋","aliases":[],"qualitySignals":{}},
 {"candidateId":"pangudawn:99","title":"伪造的故事","author":"مجهول","qualitySignals":{"authorPlaceholder":True}}
]}
def approved():
 return {"candidateId":"pangudawn:15820","approved":True,"workType":"original-prose-serial",
  "id":"heavenly-secrets-pavilion-at-start","reviewer":"manual-editor",
  "reviewedAt":str(date.today()),"summary":"A fantasy traveller receives an unusual pavilion and uses it to investigate hidden mysteries.",
  "status":"Completed","genres":["Cultivation","Fantasy"],"textReuse":"none","coversReuse":"none",
  "source":{"provider":"Fanqie","url":"https://fanqienovel.com/page/6990230896360033293",
  "confirmedTitle":"玄幻：开局一座天机阁","confirmedAuthor":"三尺青锋",
  "pageType":"work-page","inspectionMethod":"manual-publisher-page"}}
R={"schema":"novalume.external-series.v1","series":[]}
E={"schema":"novalume.source-evidence.v1","claims":[]}
class PromotionTests(unittest.TestCase):
 def test_valid_verified_publisher_source(self):
  r=review_batch(C,{"schema":SCHEMA,"decisions":[approved()]},R,E)
  self.assertEqual(r["added"],1)
  self.assertEqual(r["records"][0]["candidateOrigin"],"pangudawn:15820")
 def test_keyword_page_is_not_direct_source(self):
  d=approved();d["source"]["url"]="https://fanqienovel.com/keyword/7323056885827995686"
  with self.assertRaises(ValueError):validate_decision(d,C["candidates"][0])
 def test_chapter_page_is_not_canonical_work(self):
  d=approved();d["source"]["url"]="https://fanqienovel.com/reader/6990230896360033293"
  with self.assertRaises(ValueError):validate_decision(d,C["candidates"][0])
 def test_source_author_and_title_are_confirmed(self):
  d=approved();d["source"]["confirmedAuthor"]="Someone Else"
  with self.assertRaisesRegex(ValueError,"author"):validate_decision(d,C["candidates"][0])
 def test_placeholder_author_never_auto_promotes(self):
  d=approved();d["candidateId"]="pangudawn:99";d["source"]["confirmedTitle"]="伪造的故事";d["source"]["confirmedAuthor"]="مجهول"
  with self.assertRaisesRegex(ValueError,"Low-quality"):validate_decision(d,C["candidates"][1])
 def test_block_unapproved_external_host(self):
  d=approved();d["source"]["url"]="https://not-publisher.example/page/6990230896360033293"
  with self.assertRaises(ValueError):validate_decision(d,C["candidates"][0])
 def test_existing_title_author_is_not_duplicated(self):
  old={"schema":R["schema"],"series":[{"id":"different-id","title":C["candidates"][0]["title"],
      "author":C["candidates"][0]["author"],"sourceUrl":"https://www.tadu.com/book/7777"}]}
  with self.assertRaisesRegex(ValueError,"Same title"):review_batch(C,{"schema":SCHEMA,"decisions":[approved()]},old,E)
 def test_replay_is_idempotent(self):
  first=review_batch(C,{"schema":SCHEMA,"decisions":[approved()]},R,E)["records"]
  r=review_batch(C,{"schema":SCHEMA,"decisions":[approved()]},{"schema":R["schema"],"series":first},E)
  self.assertEqual(r["alreadyPresent"],1);self.assertEqual(r["added"],0)
 def test_deny_unreviewed_or_copied_chapter(self):
  d=approved();d["approved"]=False
  with self.assertRaises(ValueError):validate_decision(d,C["candidates"][0])
  d=approved();d["textReuse"]="copied"
  with self.assertRaises(ValueError):validate_decision(d,C["candidates"][0])
if __name__=="__main__":unittest.main()
