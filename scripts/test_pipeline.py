import io, json, unittest, zipfile
from pathlib import Path
from ingest_standardebooks import extract_chapter,ingest,ordered_chapter_paths
ROOT=Path(__file__).resolve().parents[1]
class Tests(unittest.TestCase):
    def test_extract_xhtml(self):
        d=extract_chapter('<html><body><h2>One</h2><p>Alpha <i>Beta</i>.</p><p>Gamma.</p></body></html>')
        self.assertEqual(d['title'],'One')
        self.assertEqual(d['paragraphs'],['Alpha Beta.','Gamma.'])
    def test_opf_spine_beats_lexical_filename_order(self):
        base='demo-master/src/epub/'
        opf='''<package xmlns="http://www.idpf.org/2007/opf"><manifest>
          <item id="second" href="text/chapter-10.xhtml"/>
          <item id="first" href="text/chapter-2.xhtml"/>
          <item id="intro" href="text/titlepage.xhtml"/>
          </manifest><spine><itemref idref="intro"/><itemref idref="first"/>
          <itemref idref="second"/></spine></package>'''
        buff=io.BytesIO()
        with zipfile.ZipFile(buff,'w') as z:
            z.writestr(base+'content.opf',opf)
            for name in ('chapter-10.xhtml','chapter-2.xhtml','titlepage.xhtml'):
                z.writestr(base+'text/'+name,'<p>Test</p>')
        with zipfile.ZipFile(io.BytesIO(buff.getvalue())) as z:
            result=ordered_chapter_paths(z)
        self.assertEqual([v.rsplit('/',1)[-1] for v in result],['chapter-2.xhtml','chapter-10.xhtml'])
    def test_opf_rejects_missing_spine_file(self):
        base='demo-master/src/epub/'
        opf='<package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="a" href="text/chapter-1.xhtml"/></manifest><spine><itemref idref="a"/></spine></package>'
        buff=io.BytesIO()
        with zipfile.ZipFile(buff,'w') as z:z.writestr(base+'content.opf',opf)
        with zipfile.ZipFile(io.BytesIO(buff.getvalue())) as z:
            with self.assertRaisesRegex(ValueError,'unavailable'):ordered_chapter_paths(z)
    def test_gate_blocks_unreviewed(self):
        with self.assertRaises(ValueError):ingest({'id':'unreviewed','rights':{'decision':'pending'}})
    def test_catalog_status(self):
        books=json.loads((ROOT/'public/data/catalog.json').read_text())
        for b in books:
            if b['status']=='ready':
                self.assertTrue((ROOT/'public/data/books'/f"{b['id']}.json").exists())
    def test_public_catalog_has_only_really_hosted_books(self):
        manifest=json.loads((ROOT/'content/rights_manifest.json').read_text())
        catalog=json.loads((ROOT/'public/data/catalog.json').read_text())
        expected={b['id'] for b in manifest if b['rights']['decision']=='approved'
                  and (ROOT/'public/data/books'/f"{b['id']}.json").exists()}
        self.assertEqual({b['id'] for b in catalog},expected)
        for b in catalog:
            content=json.loads((ROOT/'public/data/books'/f"{b['id']}.json").read_text())
            self.assertEqual(b['status'],'ready')
            self.assertEqual(b['chapterCount'],len(content['chapters']))
            self.assertEqual(b['chapterTitles'],[str(c.get('title') or f'Section {i}')
                for i,c in enumerate(content['chapters'],1)])
            words=[sum(len(str(p).split()) for p in c['paragraphs']) for c in content['chapters']]
            self.assertEqual(b['chapterWordCounts'],words)
            self.assertEqual(b['wordCount'],sum(words))
            self.assertNotIn('storySignals',b)
            self.assertNotIn('featured',b)
    def test_partial_edition_is_explicit(self):
        catalog=json.loads((ROOT/'public/data/catalog.json').read_text())
        pride=next(b for b in catalog if b['id']=='pride-and-prejudice')
        self.assertEqual(pride['hostedScope'],'sample')
        self.assertEqual(pride['chapterCount'],1)
    def test_rights_manifest_shape(self):
        manifest=json.loads((ROOT/'content/rights_manifest.json').read_text())
        self.assertTrue(len(manifest)>=25)
        self.assertEqual(len({x['id'] for x in manifest}),len(manifest))
        for b in manifest:
            self.assertTrue(b['rights']['decision'] in ('pending','approved','rejected'))
            self.assertGreaterEqual(b['firstPublicationYear'],1700)
if __name__=='__main__':unittest.main()
