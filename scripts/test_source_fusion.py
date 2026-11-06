import json, unittest
from copy import deepcopy
from pathlib import Path
from fuse_series_metadata import fuse, build_registry, validate_sources
ROOT=Path(__file__).resolve().parents[1]


class SourceFusionTests(unittest.TestCase):
    def test_live_seed_reconciles_source_claims(self):
        index=build_registry()
        self.assertGreaterEqual(index['coverage']['total'],43)
        self.assertEqual(index['coverage']['multiSource'],6)
        self.assertEqual(index['coverage']['conflicts'],0)
        self.assertGreaterEqual(index['coverage']['needsReview'],1)
        overgeared=next(x for x in index['series'] if x['id']=='overgeared')
        self.assertEqual(overgeared['workStatus'],'Completed')
        self.assertEqual(len(overgeared['sourceReferences']),2)
        self.assertEqual(set(x['name'] for x in overgeared['sourceReferences']),{'Wuxiaworld','Novel Updates'})
        self.assertNotIn('chapterText',json.dumps(index))
    def test_conflict_is_visible_and_status_unknown(self):
        claims={'schema':'novalume.source-evidence.v1','claims':[
            {'seriesId':'x','provider':'Wuxiaworld','sourceUrl':'https://www.wuxiaworld.com/novel/x','sourceKind':'licensed-publisher','reusePolicy':'manual-facts-and-link-only','observedAt':'2026-11-06','claims':{'workStatus':'Completed'}},
            {'seriesId':'x','provider':'Novel Updates','sourceUrl':'https://www.novelupdates.com/series/x/','sourceKind':'community-index','reusePolicy':'manual-facts-and-link-only','observedAt':'2026-11-06','claims':{'workStatus':'Ongoing'}}
        ]}
        original={'id':'x','title':'Test','workStatus':'Completed'}
        results=fuse([original],claims)
        self.assertEqual(results[0]['workStatus'],'Unknown')
        self.assertIn('workStatus',results[0]['sourceDisagreements'])
        self.assertEqual(results[0]['sourceConfidence'],'Sources disagree')
        self.assertEqual(original['workStatus'],'Completed')
    def test_rejects_malicious_urls_and_copied_content(self):
        example=json.loads((ROOT/'content/series_evidence.json').read_text())
        ids={x['id'] for x in json.loads((ROOT/'content/series_registry.json').read_text())['series']}
        self.assertTrue(validate_sources(example,ids))
        changed=deepcopy(example)
        changed['claims'][0]['sourceUrl']='https://fake.example/series'
        with self.assertRaises(ValueError):validate_sources(changed,ids)
        changed=deepcopy(example)
        changed['claims'][0]['claims']['synopsis']='copied copyrighted text'
        with self.assertRaises(ValueError):validate_sources(changed,ids)
    def test_same_provider_is_not_two_independent_sources(self):
        record={'id':'x','workStatus':'Unknown'}
        claim={'seriesId':'x','provider':'Royal Road','sourceUrl':'https://www.royalroad.com/fiction/1/x','sourceKind':'author-hosting-platform','reusePolicy':'manual-facts-and-link-only','observedAt':'2026-11-06','claims':{'workStatus':'Ongoing'}}
        other=deepcopy(claim);other['sourceUrl']='https://www.royalroad.com/fiction/2/x'
        result=fuse([record],{'schema':'novalume.source-evidence.v1','claims':[claim,other]})[0]
        self.assertEqual(result['sourceCount'],1)
        self.assertEqual(result['sourceConfidence'],'One reviewed source')


if __name__=='__main__':unittest.main()
