# All-published-title coverage: the actual acquisition plan

**As of 8 November 2026: 56 real series indexed.** The new UI can present
thousands, but it has no fabricated novel records, ratings or reviews.

## Licensing and provider matrix

| Data channel | How to obtain it lawfully | Important limitation |
| --- | --- | --- |
| Wikidata CC0 | Wikidata Query Service (small paginated queries), entity dumps or CC0 database snapshots | Incomplete for serial fiction; QIDs can point to anime/manhwa adaptations or translated *editions* |
| Open Library CC0 | Monthly compressed **works, editions and author** dump exports | Mostly book/edition bibliography; cannot turn a print ISBN into a web-serial URL or a completed chapter count |
| Author opt-in | Direct author-provided title, aliases, ID, own URL, language, status and metadata permission | Verify identity, rights ownership and translations/exclusivity; self-assertions are not proof |
| Licensed publisher feeds | Negotiate authorised CSV/ONIX/API feeds from Royal Road, Wuxiaworld, Webnovel, Qidian, Kakao, Naver, Tapas and others | Direct publisher API/bulk access must be explicitly permitted, not inferred from public website access |
| Manual independent factual research | Individually check public factual data and outbound URLs | Very low throughput; do not reproduce rival review/tag databases or bypass platform terms |
| Real community contributors | Verified edits, correction queues, sourced novel suggestions, opt-in ratings/reviews | Requires authentication, abuse controls, moderation, deletion and privacy preferences |

Wuxiaworld explicitly limits automated access/extraction and certain AI uses.
Webnovel grants narrow personal-use rights; a public link does not confer a right
to mine the text. A *metadata-only* index can be legally distinct from chapter
hosting, but terms, database rights, copied editorial descriptions and art still matter.

## The canonical work model

**Never store one record per URL.** Model separate linked concepts:

1. Original **work**, native title and aliases, author pseudonyms and authoritative IDs.
2. Language-specific **translation** (new editor, translation rights, status).
3. **Serial source / venue** where it is read, with exact URL and availability.
4. Printed **edition**, ISBN and physical/digital publishing details.
5. Adapted **work** (webtoon, manhwa, anime, drama, film) linked through an adaptation edge,
   never mistaken for the original prose.
6. Chapter update signals with provenance and timestamp, only from provider-approved feeds.
7. User-owned reviews/ratings/list membership (not scraped user reviews or invented numbers).
8. Fine-grained event intelligence only from edition text where the processing/derived-index
   rights were separately granted and the evidence is appropriately spoiler-gated.

Every claim needs: source ID, source URL, acquisition method and licence, observation date,
whether original or translation, review confidence and stale/contradicted status.

## The executable intake pipeline

\`scripts/metadata_intake.py\` accepts:
- Downloaded Wikidata SPARQL JSON: \`--wikidata-json data.json\`
- Licensed CC0 Open Library bulk *works* dump TSV, with .gz/.bz2 streaming:
  \`--openlibrary-works ol_dump_works_latest.txt.gz\`
- Consenting author-submitted CSV: \`--author-csv submissions.csv\`
- Mandatory \`--out /path/to/quarantine.json\`

Example:

\`\`\`sh
python3 scripts/metadata_intake.py --wikidata-json wikidata-export.json \
  --openlibrary-works ol_dump_works_latest.txt.gz \
  --author-csv submissions.csv --out /tmp/novalume-review.json
\`\`\`

The importer deliberately **does not add new titles to the public site**.
It produces a review queue with source, metadata licence, ambiguity flags and candidate
matches against the existing 43-work registry. No publisher site crawling.
A candidate needs a verified original work/author and legitimate work URL
before publication; a trusted review may then extend \`content/series_registry.json\`
and \`content/series_evidence.json\`.

SPARQL seed query: \`docs/wikidata-webfiction.rq\`. The genre item is Q2552040.
The query is **high precision but low recall**; works without that Wikidata genre
won't appear. Do not claim that a zero-result source query means the novel does not exist.

Open Library monthly dumps:
https://openlibrary.org/developers/dumps

Wikidata CC0 query and data access:
https://www.wikidata.org/wiki/Help:Data_access

Royal Road series search:
https://www.royalroad.com/fictions/search

Publisher restrictions:
https://www.wuxiaworld.com/terms-of-service
https://www.webnovel.com/terms_of_service

## Roadmap with honest counts

- Current: 43 source-linked, with 14 legacy records needing recheck.
- Gate 1: 100+ independently verified original serial works; no duplicate translated editions.
- Gate 2: 1,000 verified genuine indexed works with working outbound URLs and provenance.
- Gate 3: 10,000+ by author submissions and permissioned provider feeds, not scraping a
  rival's entire catalogue.
- Gate 4: Full community features—real users, ratings, spoiler controls, taste
  neighbours, public reviews, moderation and reporting.

The quality gate measures *unique real original serial works*, source link accuracy,
duplicate/adaptation rate, status provenance, and percentage of records with recent checks.
No fabricated counts, copied source descriptions or unlicensed art.


## Additional 7,476-record Chinese webnovel candidate source

An upstream GitHub project, HeTaobaba123/arabic-chinese-novels-dataset,
advertises a CC0-1.0 metadata file for 7,476 Chinese webnovels:
https://github.com/HeTaobaba123/arabic-chinese-novels-dataset

The 1,690,037-byte release asset was verified and downloaded in GitHub Action 42331814423. Of 7,476 upstream records, 7,041 candidate identities were quarantined and 435 rejected. No identity has a verified original publisher URL and NO candidate has been promoted into Novalume's 54 public linked works. This is not 7,476 more public works.

The converter scripts/import_cc0_webnovel_candidates.py accepts the
downloaded local .gz or JSON. It quarantines only Chinese title, author,
optional alternate title, broad genre and source identity. It explicitly
discards copied prose, chapters, translated excerpts, covers, community
ratings, audience view counts and inferred source URLs.

Command after obtaining the asset legitimately:

python3 scripts/import_cc0_webnovel_candidates.py --snapshot novels-metadata.ar-zh.json.gz --output /tmp/novalume-review.json

The uploader's CC0 assertion does not necessarily cover third-party
descriptions or rights they do not own. A candidate is NOT an original
webnovel record until source, author identity, original edition and
legitimate reading link have been independently checked.

Another publicly found collection, shaido987/novel-dataset, says it
scraped 24,639 Novel Updates entries but has no confirmed reuse
licence. Do not mirror it. An academic Qidian-Webnovel Corpus 110
licenses some metadata CC BY 4.0 but restricts comments and reader
responses under a separate data transfer agreement. Do not harvest
user personal information or restricted comments.

### Verified source-intake audit (GitHub Actions 42331814423)

One-time workflow downloaded the actual 7,476-row upstream snapshot, validated it, and uploaded 7,041 quarantined identity proposals to https://github.com/ibrahimraja2324/git_test/actions/runs/42331814423/artifacts/13557761662 . Counts from the run: 435 structurally rejected rows, 2,810 placeholder authors, 97 possibly non-novel source categories, 64 inferred Chinese byline authors requiring independent verification, 0 official/publisher URLs verified, **0 published Novalume works added**. There are substantial data-quality risks. Review artifact expires after seven days; a conversation attachment copy is also available.

### First audited publisher matches (8 Nov 2026)

Two upstream identities gained specific, legitimate source links after independent page checks:
- pangudawn:15820 — 玄幻：开局一座天机阁, 三尺青锋, Fanqie https://fanqienovel.com/page/6990230896360033293
- pangudawn:15608 — 我的眷族全是沙雕玩家, 滑稽大师兄, Tadu https://www.tadu.com/book/802975

The actual checked records increased from 54 to 56. The other **7,039 quarantined identities have not been promoted** and lack source verification. The short synopses on Novalume are independently written; chapters and publisher blurbs were not mirrored.

A review promotion script (scripts/promote_reviewed_novels.py) and corresponding unit and GitHub Actions tests now require exact source URLs, matching titles/authors, explicit manual verification, no duplicate IDs, valid source pages (not keyword/reader URLs), and no copied text. Approved outputs are staged for separate code review rather than deployed automatically.

Readers can submit missing novels in the #community page to a private, owner-isolated Supabase novalume_title_suggestions queue. Submissions alone cannot change the public directory or declare approvals; only privileged data review can do that.
