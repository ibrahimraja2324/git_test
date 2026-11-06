import unittest
from propose_wikidata import propose_wikidata_export,match_candidates


def entry(qid,title,kind,author,language):
    return {k:{'value':v} for k,v in {
        'item':'http://www.wikidata.org/entity/'+qid,
        'itemLabel':title,
        'workTypeLabel':kind,
        'authorLabel':author,
        'languageLabel':language
    }.items()}


class WikidataProposalTests(unittest.TestCase):
    def setUp(self):
        self.books=[{'id':'lotm','title':'Lord of the Mysteries','author':'Cuttlefish That Loves Diving','aliases':['Lord of Mysteries']}]
    def test_cc0_novel_match_proposes_no_auto_publication(self):
        result=propose_wikidata_export({'results':{'bindings':[
            entry('Q109342457','Lord of Mysteries','novel series','Cuttlefish That Loves Diving','Chinese')
        ]}},self.books)
        self.assertEqual(result['proposed'][0]['identityMatches'][0]['id'],'lotm')
        self.assertEqual(result['proposed'][0]['decision'],'quarantine')
        self.assertEqual(result['proposed'][0]['claims']['originalLanguage'],'Chinese')
    def test_animated_adaptation_is_not_the_original_novel(self):
        result=propose_wikidata_export({'results':{'bindings':[
            entry('Q136027036','Lord of Mysteries','animated web series','Cuttlefish That Loves Diving','Chinese')
        ]}},self.books)
        self.assertEqual(result['proposed'],[])
        self.assertEqual(result['rejected'][0]['reason'],'not-a-confirmed-original-literary-work')
    def test_title_only_cannot_silently_merge(self):
        self.assertEqual(match_candidates('Lord of Mysteries','Other Writer',self.books)[0]['quality'],'title-only')
    def test_bad_qid_rejected(self):
        result=propose_wikidata_export({'results':{'bindings':[entry('bad','Fake','novel','Someone','English')]}},self.books)
        self.assertEqual(len(result['rejected']),1)


if __name__=='__main__':unittest.main()
