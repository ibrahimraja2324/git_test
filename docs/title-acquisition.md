# All-published-title coverage: the actual acquisition plan

**As of 7 November 2026: 43 real series indexed.** The new UI can present
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
