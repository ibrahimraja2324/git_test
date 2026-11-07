"""Guard the source-linked Royal Road batch against catalogue/evidence drift."""
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
BATCH={"mark-of-the-fool","the-hedge-wizard","bog-standard-isekai","arkendrithyst","unintended-cultivator","elydes","the-grand-game","the-legend-of-william-oh","the-weirkey-chronicles","the-last-orellen"}

class RoyalRoadEditorialBatchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry=json.loads((ROOT/"content/series_registry.json").read_text(encoding="utf-8"))
        cls.evidence=json.loads((ROOT/"content/series_evidence.json").read_text(encoding="utf-8"))
    def test_all_ten_are_unique_link_only_originals(self):
        self.assertEqual(len(BATCH),10)
        self.assertGreaterEqual(len(self.registry["series"]),66)
        rows={r["id"]:r for r in self.registry["series"]}
        self.assertTrue(BATCH.issubset(rows))
        for id_ in BATCH:
            row=rows[id_]
            self.assertEqual(row["kind"],"external-index")
            self.assertEqual(row["originalLanguage"],"English")
            self.assertEqual(row["sourcePlatform"],"Royal Road")
            self.assertIn("/fiction/",row["sourceUrl"])
            self.assertEqual(row["sourceAudit"],"source-page-observed")
            self.assertEqual(row["sourcePolicy"],"manual-facts-and-editorial-summary")
            self.assertFalse(any(k in row for k in ("chapters","chapterText","text","cover","ratings","views")))
    def test_exact_source_claims_match_public_directory(self):
        rows={r["id"]:r for r in self.registry["series"]}
        claims={}
        for item in self.evidence["claims"]:
            if item["seriesId"] in BATCH:
                self.assertNotIn(item["seriesId"],claims)
                claims[item["seriesId"]]=item
        self.assertEqual(set(claims),BATCH)
        for id_ in BATCH:
            row=rows[id_]
            item=claims[id_]
            self.assertEqual(item["sourceUrl"],row["sourceUrl"])
            self.assertEqual(item["provider"],"Royal Road")
            self.assertEqual(item["reusePolicy"],"manual-facts-and-link-only")
            for field in ("title","author","originalLanguage","workStatus"):
                self.assertEqual(item["claims"][field],row[field])
    def test_stubs_and_hiatus_are_not_claimed_as_complete(self):
        rows={r["id"]:r for r in self.registry["series"]}
        self.assertEqual(rows["arkendrithyst"]["workStatus"],"Completed")
        for id_ in BATCH-{"arkendrithyst"}:
            self.assertEqual(rows[id_]["workStatus"],"Unknown")
            self.assertIn("statusNote",rows[id_])

if __name__=="__main__":
    unittest.main()
