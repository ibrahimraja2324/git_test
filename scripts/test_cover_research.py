import unittest
from research_cover_candidates import normalize,title_ok,author_ok,eligible
class CoverResearchTests(unittest.TestCase):
 def test_normalize(self):
  self.assertEqual(normalize('J. M. Clarke'),'jmclarke')
 def test_title_one(self):
  self.assertTrue(title_ok('Dungeon Life','Dungeon Life: An Isekai LitRPG'))
  self.assertTrue(title_ok('The Primal Hunter','The Primal Hunter: Book One'))
  self.assertFalse(title_ok('The Primal Hunter','The Primal Hunter: Book Two'))
  self.assertFalse(title_ok('Chrysalis','Chrysalis: An Unrelated Tale'))
 def test_exact_source_and_author(self):
  w={'title':'Mark of the Fool','author':'J. M. Clarke'}
  good={'title':'Mark of the Fool','author_name':['J. M. Clarke'],'key':'/works/OL123W','cover_i':812345}
  self.assertTrue(eligible(good,w))
  self.assertFalse(eligible({**good,'author_name':['Someone Else']},w))
  self.assertFalse(eligible({**good,'cover_i':-1},w))
  self.assertFalse(eligible({**good,'key':'/authors/OL123A'},w))
if __name__=='__main__':unittest.main()
