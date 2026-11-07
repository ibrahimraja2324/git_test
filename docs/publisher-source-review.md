# Novel publication approval process

A candidate from the 7,476-source-record Chinese release cannot enter the public Novalume directory unless its original author/title and a specific legitimate publisher novel page are independently verified. The upstream CC0 claim does not license chapters or copied descriptions. The current 7,041 staged candidates have zero verified URLs, except the two independently checked works now separately recorded in the official directory.

The script scripts/promote_reviewed_novels.py reads a quarantine JSON (novalume.cc0-webnovel-candidates.v1) and a signed editorial decision manifest (novalume.publisher-review-decisions.v1). It requires exact novel page URLs, source title+author matching, explicit original prose verification, an editorial summary, supported source provider and inspection date. It refuses search/keyword pages and chapter pages. It rejects placeholders, duplicate source URLs, duplicate original titles/authors and unreviewed data. No automatic crawling.

Dry-run command:

    python3 scripts/promote_reviewed_novels.py --candidates /tmp/novalume-review-candidates.json --decisions content/source-review-decisions.json

To stage outputs, append --apply --output-directory /tmp/reviewed . This does not deploy them. Both the catalogue and source evidence ledger must be reviewed and committed together, then the Supabase novalume_works lookup synchronised before public review posting works on new novels.

The decision manifest currently includes two verified source pages, at https://fanqienovel.com/page/6990230896360033293 and https://www.tadu.com/book/802975 . These entries already exist in the catalogue, so replay is idempotent. All other 7,039 candidates remain unapproved until source review.
