"""Only publish explicit editorial premise cues, never infer chapter events."""
import json
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ALLOWED={
 'public_recognition','visible_reactions','measurable_growth','earned_power',
 'long_term_payoff','smart_protagonist','social_reversal','relationship_tension',
 'fast_pacing','world_consequence'
}
def validate_hints(hints,registry):
 assert hints.get('schema')=='novalume.editorial-premise-hints.v1'
 assert hints.get('observedAt')=='2026-11-08'
 assert isinstance(hints.get('claims'),list)
 byid={w['id']:w for w in registry['series']}
 assert len(byid)==len(registry['series'])
 seen=set()
 for row in hints['claims']:
  assert set(row)=={'workId','dimension','summaryPhrase','class','field'}
  assert row['dimension'] in ALLOWED
  assert row['class']=='editorial-premise' and row['field']=='summary'
  assert row['workId'] in byid
  assert isinstance(row['summaryPhrase'],str) and 8<=len(row['summaryPhrase'])<=125
  assert row['summaryPhrase'] in byid[row['workId']]['summary']
  key=(row['workId'],row['dimension'])
  assert key not in seen
  seen.add(key)
 assert 15<=len(seen)<=100
 return True
class PremiseClaimsTests(unittest.TestCase):
 def setUp(self):
  self.registry=json.loads((ROOT/'content/series_registry.json').read_text('utf8'))
  self.data=json.loads((ROOT/'content/premise_claims.json').read_text('utf8'))
 def test_all_claims_have_exact_contiguous_edition_independent_evidence(self):
  self.assertTrue(validate_hints(self.data,self.registry))
 def test_claims_cannot_smuggle_unsupported_chapter_or_new_source(self):
  self.data['claims'][0]['chapterText']='copyrighted work excerpt'
  with self.assertRaises(AssertionError):validate_hints(self.data,self.registry)
 def test_invented_trait_is_rejected(self):
  self.data['claims'][0]['dimension']='officially_proven_popularity'
  with self.assertRaises(AssertionError):validate_hints(self.data,self.registry)
if __name__=='__main__':unittest.main()
