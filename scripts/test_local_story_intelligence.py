import unittest
from local_story_intelligence import allowed_book,chunks,packets,validate_candidates
class LocalStoryTests(unittest.TestCase):
 def test_only_approved_hosted_text_may_be_processed(self):
  self.assertTrue(allowed_book('dracula')['chapters'])
  for id_ in ('lord-of-the-mysteries','../../secret','never-real'):
   with self.assertRaises(ValueError):allowed_book(id_)
 def test_analysis_scope_is_explicit_for_reviewed_classics(self):
  self.assertTrue(allowed_book('frankenstein')['chapters'])
 def test_windowing_preserves_original_passage(self):
  s='The protagonist discovers power then reveals it to the audience. '*230
  spans=chunks(s,3300,180)
  self.assertGreater(len(spans),3)
  self.assertEqual(spans[0][0],0)
  self.assertEqual(spans[-1][1],len(s))
  self.assertTrue(all(s[a:b]==text for a,b,text in spans))
 def test_multiple_chapters_are_chunked_with_provenance(self):
  p=list(packets('pride-and-prejudice',allowed_book('pride-and-prejudice'),1,1))
  self.assertGreaterEqual(len(p),10)
  self.assertTrue(all(x['bookId']=='pride-and-prejudice' and x['chapter']==1 for x in p))
  self.assertTrue(all(len(x['sourceSha256'])==64 for x in p))
 def test_invalid_model_claims_are_discarded_not_published(self):
  packet={'bookId':'x','chapter':1,'paragraph':1,
          'sourceSha256':'0'*64,'text':'A source character is explicitly described as entering the room.'}
  response={'candidates':[
    {'claim':'A source character enters the room according to the passage.',
     'evidenceAnchor':'explicitly described as entering',
     'topics':['arrival'],'eventType':'arrival','actor':'character','action':'enters','object':'room'},
    {'claim':'A completely invented true secret with no actual support.',
     'evidenceAnchor':'not present anywhere',
     'topics':['secret']}
  ]}
  valid=validate_candidates(response,packet)
  self.assertEqual(len(valid),1)
  self.assertEqual(valid[0]['status'],'automated-candidate')
  self.assertNotIn('verified',valid[0]['status'])
 def test_bad_candidate_schema_rejected(self):
  with self.assertRaises(ValueError):validate_candidates({}, {'text':'Hi'})
if __name__=='__main__':unittest.main()
