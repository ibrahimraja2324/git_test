import unittest
from copy import deepcopy
from static_story_observations import permits_static_analysis, sentences, sentence_observation, mine_book

RIGHTS={'id':'demo','originalLanguage':'en','translation':False,
        'rights':{'decision':'approved','analysisPermissions':{'allowed':True,'basis':'original-public-domain-and-cc0-edition'}}}

class StaticObservationsTests(unittest.TestCase):
    def test_complete_sentence_spans_are_stable(self):
        p='Victor was frightened. He feared the creature! Then he left the room.'
        s=list(sentences(p))
        self.assertEqual(len(s),3)
        self.assertEqual(s[0][2],'Victor was frightened.')
        self.assertEqual(s[-1][2],'Then he left the room.')
        self.assertTrue(all(p[a:b]==t for a,b,t in s))
    def test_modal_and_negation_marked_uncertain(self):
        p='If Victor had not believed that a creature might attack, he would have remained.'
        item=sentence_observation('demo',1,1,0,p,p)
        self.assertTrue(item['uncertainty']['hypotheticalLanguage'])
        self.assertTrue(item['uncertainty']['negationPresent'])
        self.assertIn('believed',item['predicateCandidates'])
        self.assertEqual(item['verification'],'literal-text-candidate-not-confirmed-plot-fact')
    def test_high_recall_dynamic_cues_not_false_facts(self):
        p='The crowd watched Victor reveal a power which surprised his enemies.'
        item=sentence_observation('demo',3,5,0,p,p)
        self.assertIn('public-reaction',item['rankingHints'])
        self.assertIn('progression',item['rankingHints'])
        self.assertNotIn('verifiedFact',item)
        self.assertNotIn('causalRelation',item)
        self.assertEqual(item['chapter'],3)
    def test_index_across_all_chapters_with_real_provenance(self):
        b={'id':'demo','chapters':[
           {'paragraphs':['Victor created a strange being. Everybody was horrified by the creature.']},
           {'paragraphs':['The creature later returned to the castle. The villagers feared it.']}
        ]}
        index,summary=mine_book('demo',b,RIGHTS)
        self.assertEqual(summary['chapterCount'],2)
        self.assertEqual(summary['chapterCoverage'],2)
        self.assertGreaterEqual(summary['candidateObservations'],3)
        self.assertEqual(index['schema'],'novalume.private-static-observations.v1')
        self.assertTrue(all('paragraphSha256' in x for x in index['observations']))
    def test_rights_are_independent_of_hosting_and_third_party_links(self):
        r=deepcopy(RIGHTS)
        r['rights']['analysisPermissions']['allowed']=False
        self.assertFalse(permits_static_analysis(r))
        with self.assertRaises(PermissionError):
            mine_book('demo',{'id':'demo','chapters':[{'paragraphs':['Any words.']}]},r)
        r=deepcopy(RIGHTS);r['originalLanguage']='ko'
        self.assertFalse(permits_static_analysis(r))
        r=deepcopy(RIGHTS);r['translation']=True
        self.assertFalse(permits_static_analysis(r))
    def test_no_republication_of_raw_corpus_in_public_stats(self):
        book={'id':'demo','chapters':[{'paragraphs':['Victor feared the creature.']}]}
        _,pub=mine_book('demo',book,RIGHTS)
        for term in ('observations','evidencePreview','paragraphs','sourceText'):
            self.assertNotIn(term,pub)
if __name__=='__main__':
    unittest.main()
