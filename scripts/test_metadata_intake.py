import csv
import gzip
import json
import tempfile
import unittest
from pathlib import Path
from metadata_intake import collision,proposal,wikidata_spaqrl,openlibrary_dump,author_csv,group_candidates
EXISTING=[{'id':'lord-of-the-mysteries','title':'Lord of the Mysteries','aliases':['LOTM'],
 'sourceUrl':'https://www.novelupdates.com/series/lord-of-the-mysteries/'}]
def wdrow(qid,label,kind='web fiction',author='Someone',language='Chinese'):
 return {k:{'value':v} for k,v in {
  'item':'http://www.wikidata.org/entity/'+qid,'itemLabel':label,
  'workTypeLabel':kind,'authorLabel':author,'languageLabel':language
 }.items()}
class MetadataIntakeTests(unittest.TestCase):
 def test_wikidata_is_cc0_and_does_not_autopublish(self):
  inp={'results':{'bindings':[wdrow('Q100','A Real Fiction')]} }
  rows=wikidata_spaqrl(inp,EXISTING)
  self.assertEqual(rows[0]['metadataLicense'],'CC0')
  self.assertFalse(rows[0]['publicationReady'])
  self.assertEqual(rows[0]['reviewStatus'],'quarantine')
  self.assertIn('Legitimate original/publisher series URL missing',rows[0]['reviewIssues'])
 def test_adaptations_are_not_wrongly_merged_as_novels(self):
  inp={'results':{'bindings':[wdrow('Q100','A Real Fiction','animated series'),wdrow('Q101','A Real Fiction','web fiction')]}}
  rows=wikidata_spaqrl(inp,EXISTING)
  self.assertEqual(len(rows),1)
 def test_exact_aliases_warn_but_do_not_force_merge(self):
  item=proposal('wikidata','Q123','LOTM','Someone','Chinese','web fiction')
  same=collision(item['work'],EXISTING)
  self.assertEqual(same['sameTitleOrAlias'],['lord-of-the-mysteries'])
  self.assertIn('Never merge by title alone',same['mergePolicy'])
 def test_openlibrary_bulk_dump_streams_only_explicit_webnovel_candidates(self):
  with tempfile.TemporaryDirectory() as td:
   file=Path(td)/'sample.txt.gz'
   records=[
    ['/type/work','/works/OL1W','1','2026','{"key":"/works/OL1W","title":"Generic Print Novel","subjects":["historical fiction"]}'],
    ['/type/work','/works/OL2W','1','2026','{"key":"/works/OL2W","title":"Serial Novel","subjects":["Web fiction","Cultivation novel"]}'],
    ['/type/edition','/books/OL3M','1','2026','{"key":"/books/OL3M","title":"Not a work","subjects":["Web fiction"]}']
   ]
   with gzip.open(file,'wt',encoding='utf8') as f:
    for row in records:f.write('\t'.join(row)+'\n')
   rows,count=openlibrary_dump(file,EXISTING)
   self.assertEqual(count,3)
   self.assertEqual(len(rows),1)
   self.assertEqual(rows[0]['work']['title'],'Serial Novel')
   self.assertEqual(rows[0]['work']['author'],'')
   self.assertFalse(rows[0]['publicationReady'])
 def test_author_csv_must_have_metadata_permission_and_valid_legitimate_url(self):
  with tempfile.TemporaryDirectory() as td:
   file=Path(td)/'works.csv'
   with file.open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['title','author','source_url','metadata_permission','original_language','work_type'])
    w.writeheader();w.writerow({'title':'Original One','author':'A','source_url':'https://www.royalroad.com/fiction/100/x','metadata_permission':'yes','original_language':'English','work_type':'web serial'})
    w.writerow({'title':'Forbidden','author':'B','source_url':'https://example.com/novel','metadata_permission':'yes'})
    w.writerow({'title':'No permission','author':'C','source_url':'https://www.royalroad.com/fiction/101/y','metadata_permission':'no'})
   rows=author_csv(file,EXISTING)
   self.assertEqual(len(rows),1)
   self.assertIn('Confirm identity/rights ownership',rows[0]['reviewIssues'][-1])
 def test_never_inflate_public_count_from_unreviewed_candidates(self):
  c=proposal('wikidata','Q123','Test Work','Unknown','Chinese','web fiction')
  c['collisions']=collision(c['work'],EXISTING)
  data=group_candidates([c,c])
  self.assertEqual(data['counts']['candidateRecords'],1)
  self.assertFalse(data['automaticPublication'])
  self.assertNotIn('series',data)
if __name__=='__main__':unittest.main()
