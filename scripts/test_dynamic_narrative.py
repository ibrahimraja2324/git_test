import unittest,json
from pathlib import Path
from dynamic_narrative import mine_book,score_query,entities_in,safe_summary,corpus_idf,ROOT

class DynamicTests(unittest.TestCase):
  def test_novel_terms_not_in_taxonomy_still_indexed(self):
    chapters=[{'paragraphs':['The quantum beetle ceremony brought the citadel to its knees.','The quantum beetle ceremony began again beneath the citadel.']}]
    result=mine_book('fictitious',chapters)
    phrases=[x['phrase'] for x in result['dynamicPhrases']]
    self.assertIn('quantum beetle ceremony',phrases)
    self.assertIn('citadel',phrases)
    self.assertGreater(score_query(result,'quantum beetle ceremony')[0],0)
  def test_evidence_and_source_hash_are_reproducible(self):
    a=mine_book('sample',[{'paragraphs':['The unusual visitors walked slowly into the castle courtyard.']}])
    self.assertEqual(a,mine_book('sample',[{'paragraphs':['The unusual visitors walked slowly into the castle courtyard.']}]))
    self.assertTrue(all(x['evidence'][0]['sourceHash'] for x in a['dynamicPhrases']))
  def test_only_counts_in_public_summary(self):
    r=mine_book('fiction',[{'paragraphs':['The hidden prince secretly inherited the crystal fortress.']}])
    p=json.dumps(safe_summary(r))
    self.assertNotIn('hidden prince',p)
    self.assertNotIn('crystal fortress',p)
  def test_character_co_mentions_not_asserted_as_relationships(self):
    r=mine_book('fiction',[{'paragraphs':['Elizabeth Bennet and Fitzwilliam Darcy stood together at the entrance.']}])
    self.assertTrue(all(x['verification']=='co-mentioned-not-necessarily-related' for x in r['coMentions']))
  def test_no_static_keywords_required(self):
    r=mine_book('fiction',[{'paragraphs':['The opaline regiment discussed the long-forgotten map under moonlight.']}])
    self.assertGreater(len(r['dynamicPhrases']),5)
  def test_zero_empty_data_fails(self):
    with self.assertRaises(ValueError):mine_book('fiction',[{'paragraphs':['A','B']}])
  def test_inverted_name_candidate(self):
    self.assertIn('Mr. Bennet',entities_in('She said that Mr. Bennet was waiting beside Mr. Bingley.'))

if __name__=='__main__':unittest.main()
