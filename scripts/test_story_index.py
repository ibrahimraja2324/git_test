import json
import tempfile
import unittest
from pathlib import Path
from build_story_index import LEXICON, ROOT, analyse_book, extract, matches_term, build
class StoryIndexTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules=json.loads(LEXICON.read_text(encoding='utf8'))
    def test_boundaries_prevent_substring_match(self):
        self.assertFalse(matches_term('heart broken','art'))
        self.assertTrue(matches_term('a SECRET was kept','secret'))
    def test_negated_phrases_not_asserted(self):
        clues=extract(['The true identity was not recognized despite the crowd.'],self.rules)
        self.assertNotIn('identity-and-recognition',[c['signalId'] for c in clues])
    def test_evidence_is_provenanced_and_deterministic(self):
        paras=['He had inherited a great fortune despite all rumours.','The queen awaited an audience at court.']
        result=extract(paras,self.rules)
        self.assertEqual(result,extract(paras,self.rules))
        self.assertTrue(all(c['sourceHash'] and c['paragraph']>0 and c['verification']=='lexical-observation' for c in result))
    def test_complete_hosted_book_only(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'test.json'
            path.write_text(json.dumps({'chapters':[{'title':'I','paragraphs':['The king was afraid of a battle.']}]}))
            result=analyse_book('test',path,self.rules)
            self.assertEqual(result['chapterCount'],1)
            self.assertEqual(result['chapters'][0]['observations'][0]['chapter'],1)
    def test_index_does_not_include_unapproved_candidates(self):
        build()
        index=json.loads((ROOT/'public/data/story_index.json').read_text())
        manifest=json.loads((ROOT/'content/rights_manifest.json').read_text())
        for book in manifest:
            if book['rights']['decision']!='approved':
                self.assertNotIn(book['id'],index['books'])

if __name__=='__main__':unittest.main()
