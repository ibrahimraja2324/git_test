import unittest
from import_cc0_webnovel_candidates import convert
class CC0CandidatesTests(unittest.TestCase):
 def test_only_bibliographic_identifiers_are_retained(self):
  x=convert([{'id':16071,'title':'邀月竟成了我师尊 by 一杆梅子酒','title_en':'邀月竟成了我师尊 by 一杆梅子酒',
             'author':'一杆梅子酒','language':'zh','category':'修仙',
             'description':'A copyrighted synopsis','chapter_count':234,
             'rating':4.9,'views':999999,'cover':'https://example.com/copy.jpg'}])
  self.assertEqual(x['acceptedCandidates'],1)
  entry=x['candidates'][0]
  self.assertEqual(entry['title'],'邀月竟成了我师尊')
  self.assertEqual(entry['categoryHint'],'Cultivation')
  self.assertIsNone(entry['officialSourceUrl'])
  self.assertFalse(entry['publicationReady'])
  self.assertFalse(entry['verifiedOriginalWork'])
  self.assertFalse(any(key in entry for key in ('description','rating','views','chapter_count','cover','content')))
 def test_dedupe_and_reject_wrong_language(self):
  x=convert({'novels':[{'id':1,'title':'Sword','author':'Writer','language':'zh'},
                       {'id':2,'title':'Sword','author':'Writer','language':'zh'},
                       {'id':3,'title':'Sword','author':'Writer B','language':'ja'}]})
  self.assertEqual(x['acceptedCandidates'],1)
  self.assertEqual(x['rejectedRows'],2)
 def test_no_public_series_records_are_emitted(self):
  x=convert([{'id':4,'title':'Story','author':'A','language':'zh'}])
  self.assertNotIn('series',x)
  self.assertIn('quarantine',x['candidates'][0]['state'])
 def test_missing_author_rejected(self):
  self.assertEqual(convert([{'id':9,'title':'Some Story','language':'zh'}])['acceptedCandidates'],0)
if __name__=='__main__':unittest.main()
