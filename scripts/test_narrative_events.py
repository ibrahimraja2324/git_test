import json
import unittest
from copy import deepcopy
from pathlib import Path
from build_narrative_events import build_index
ROOT = Path(__file__).resolve().parents[1]
RIGHTS=json.loads((ROOT/'content'/'rights_manifest.json').read_text(encoding='utf-8'))
REVIEWED=json.loads((ROOT/'content'/'reviewed_story_events.json').read_text(encoding='utf-8'))


def books():
    return {r['id']:json.loads((ROOT/'public'/'data'/'books'/f"{r['id']}.json").read_text(encoding='utf-8'))
            for r in RIGHTS if r['rights']['decision']=='approved'}


class NarrativeReviewTests(unittest.TestCase):
    def test_real_source_anchors_and_coverage(self):
        idx,coverage=build_index(RIGHTS,books(),REVIEWED)
        self.assertEqual(len(idx['events']),21)
        self.assertEqual(set(idx['books']),{'pride-and-prejudice','frankenstein','dracula'})
        self.assertTrue(all(len(e['paragraphSha256'])==64 for e in idx['events']))
        self.assertTrue(all('sourceAnchor' not in e and 'paragraphs' not in e for e in idx['events']))
        self.assertEqual(sum(b['independentlyReviewedEvents'] for b in coverage['books'].values()),0)
        self.assertLess(coverage['books']['dracula']['chaptersWithAnnotatedEvents'],28)
    def test_revoked_rights_cannot_publish_even_if_book_still_exists(self):
        rights=deepcopy(RIGHTS);annotation=deepcopy(REVIEWED)
        for r in rights:
            if r['id']=='frankenstein':r['rights']['decision']='pending'
        with self.assertRaises(ValueError):
            build_index(rights,books(),annotation)
    def test_hosting_rights_do_not_automatically_include_analysis_rights(self):
        rights=deepcopy(RIGHTS)
        for row in rights:
            if row['id']=='dracula':row['rights']['analysisPermissions']['allowed']=False
        with self.assertRaises(ValueError):build_index(rights,books(),REVIEWED)

    def test_removed_text_invalidates_stale_event(self):
        hosted=books()
        event=REVIEWED['events'][0]
        ch=event['chapter']-1;para=event['paragraph']-1
        hosted[event['bookId']]['chapters'][ch]['paragraphs'][para]='Text changed without reviewer checking'
        with self.assertRaisesRegex(ValueError,'Source anchor not found'):
            build_index(RIGHTS,hosted,REVIEWED)
    def test_unapproved_event_never_promoted(self):
        inp=deepcopy(REVIEWED);inp['events'][0]['status']='automated-candidate'
        with self.assertRaises(ValueError):build_index(RIGHTS,books(),inp)
    def test_missing_evidence_rejected(self):
        inp=deepcopy(REVIEWED);inp['events'][0]['sourceAnchor']='an invented unsupported quotation'
        with self.assertRaises(ValueError):build_index(RIGHTS,books(),inp)
    def test_raw_external_book_without_rights_rejected(self):
        inp=deepcopy(REVIEWED);inp['events'][0]['bookId']='lord-of-the-mysteries'
        with self.assertRaisesRegex(ValueError,'Unapproved'):build_index(RIGHTS,books(),inp)


if __name__=='__main__':unittest.main()
