import json, unittest
from pathlib import Path
from ingest_standardebooks import extract_chapter,ingest
ROOT=Path(__file__).resolve().parents[1]
class Tests(unittest.TestCase):
    def test_extract_xhtml(self):
        d=extract_chapter('<html><body><h2>One</h2><p>Alpha <i>Beta</i>.</p><p>Gamma.</p></body></html>')
        self.assertEqual(d['title'],'One')
        self.assertEqual(d['paragraphs'],['Alpha Beta.','Gamma.'])
    def test_gate_blocks_unreviewed(self):
        with self.assertRaises(ValueError):ingest({'id':'unreviewed','rights':{'decision':'pending'}})
    def test_catalog_status(self):
        books=json.loads((ROOT/'public/data/catalog.json').read_text())
        for b in books:
            if b['status']=='ready':
                self.assertTrue((ROOT/'public/data/books'/f"{b['id']}.json").exists())
    def test_rights_manifest_shape(self):
        manifest=json.loads((ROOT/'content/rights_manifest.json').read_text())
        self.assertTrue(len(manifest)>=25)
        self.assertEqual(len({x['id'] for x in manifest}),len(manifest))
        for b in manifest:
            self.assertTrue(b['rights']['decision'] in ('pending','approved','rejected'))
            self.assertGreaterEqual(b['firstPublicationYear'],1700)
if __name__=='__main__':unittest.main()
