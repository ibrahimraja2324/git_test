# Novalume — webnovel discovery, tracking and original reading

**Production:** https://novalume-story-search.vercel.app

## Direction (6 November 2026)
Novalume leads with a database of real serial fiction, then introduces readers to authorised reading and original author publishing. The old classics-only landing page is retained at `#read-here`, not the primary homepage.

The `#home` directory has **54 indexed webnovels** from Novel Updates, Royal Road, licensed Wuxiaworld and two CC0 Wikidata reference records. Coverage: 8 series corroborated across independent providers, 32 with one reviewed source, 14 legacy records awaiting an independent source check. Old unverified completion statuses have been downgraded to Unknown. The records use human-composed short descriptions. No copied external chapters, borrowed cover art, fake reviews or made-up user statistics are present.

- Advanced catalogue search: words from title, author, aliases, theme and editorial short summary
- Language and work-status filters; reversible include/exclude themes
- Dedicated series pages with external source links, provenance, and list tracking
- Reader-owned local lists: plan, reading, completed, on hold, dropped; manual last-chapter and notes
- JSON export and import for personal lists; no cloud sync or pretend accounts
- `#read-here`: separate rights-reviewed public-domain reader (Dracula, Frankenstein, Pride and Prejudice first-chapter sample)
- `#assistant`: experimental private text search of **hosted** chapters only, not the wider webnovel directory
- `#studio`: browser-only drafts, not online publishing

The data source is `content/series_registry.json`; tests ensure external URLs are allowlisted and no book contents or arbitrary ratings are distributed. Build reconciles copyright-safe source claims into `dist/data/series_registry.json` and attaches field-level provenance and conflicting claims.

## Next build milestones
1. Authenticated profiles and cloud-synced lists and notes (with privacy/deletion tools); then user lists, ratings and reviews with actual member provenance.
2. A scalable import and moderation pipeline to grow beyond the 54 current directory records to 100+, with duplicate handling, source attribution, status-change timestamps and safe external link checks.
3. Independent author self-publishing with drafts, rights attestation, scheduling, chapter hosting, feedback and moderation. Do not enable it before secure auth, storage and copyright reporting.
4. Improved recommendations and event semantics from rights-allowed content and consented reader feedback. Current external-series search is metadata-based only, NOT full-text understanding.

## Test and build
```sh
npm test
npm run build
npm run serve
```

See [AGENTS.md](AGENTS.md), [rights policy](docs/rights-policy.md), and [roadmap](docs/roadmap.md).

## Reader-to-reader sharing (no backend)

The reading tracker can generate a shareable `#list/id1,id2,...` link with up to 24 directory entries. It intentionally contains ONLY the publicly indexed series IDs. Reading status, progress and personal notes stay on the user's device and are **not** embedded in the URL. The shared page displays titles linked to their cited source profiles. This is a lightweight community discovery loop before real authenticated public lists and moderation exist.

## Copyright and provenance policy

**The novels remain copyrighted.** Novalume's directory hosts factual bibliographic labels, original short descriptions, and legitimate source links; no publisher chapter text, covers, translated excerpts or scraped bulk reviews. It does not confer a right to republish the actual novels. See [multi-source research](docs/source-integration.md).

Wikidata's CC0 structured statements provide potential work identities and aliases. Open Library's CC0 data dumps are appropriate for edition-level metadata. Source-specific facts from publisher and community listings require individual review or permission. The CC0 import helper always proposes a quarantined review candidate, never an automatic public listing.

Production deployed on Vercel, automated checks passed. Live browser/mobile QA remains unverified.

## Chapter-grounded story intelligence (new pilot)

We are testing the part generic genre/list sites do not provide: event-level narrative search against **actual authorised text**, including action, relationship, witnesses, public response, progression and cause/effect chronology. This pilot currently covers only **21 source-anchored editorial samples** across the three rights-reviewed classic editions; it is not exhaustive or independently human verified. These source samples never appear in the 54 copyrighted external novels, which remain metadata-only.

- The `#assistant` page has a new chapter-event search. Book matches stay spoiler-concealed unless a reader explicitly selects a book and a maximum chapter. The legacy lexical search remains separately labelled as weaker evidence.
- `scripts/build_narrative_events.py` fails closed if approval is removed, a source anchor disappears, or an annotation is an unreviewed model proposal. Event source paragraphs stay out of the public deployment.
- `scripts/local_story_intelligence.py` can packetise entire authorised classics and optionally call a **locally installed** Ollama model without any paid remote AI. It quarantines candidate facts instead of publishing them. No local inference has been executed on a connected user machine during this release.
- Read [the narrative intelligence system](docs/narrative-intelligence.md) for source consent, text access, evidence validation, independent reviewer criteria, temporal entity graphs and measurement.

We cannot legitimately crawl and process all chapters on Webnovel/Wuxiaworld/Royal Road without the relevant permissions; see their platform terms. Copyright does not disappear merely because we extract event metadata from the text.

## Full-source deterministic narrative memory (new)

The static evidence builder has now processed all **53 available sections** of the three authorised classics into **8,835 unverified textual observations** from **10,847 sentence segments**. Every candidate preserves its chapter, paragraph, source fingerprint, action/entity hints, and markers for hypotheticals, negation and speech. The private index can be searched on `/#assistant` with book-only default results and an explicit maximum-chapter spoiler reveal. This is an evidence retrieval memory, NOT 8,835 confirmed narrative events. No third-party novel chapters were downloaded or analysed; the larger linked webnovel directory remains at **54 real records**, though pagination is tested for thousands. See [the extraction design and limitations](docs/static-narrative-evidence.md).

## Reader-first discovery club — first live design

The `#home` page now has a distinctive editorial world of novel-cover shelves (CSS-generated artwork, never copied licensed covers), genuine linked Chinese/Korean/English series, and browseable genre collections. The `#tracking` area is a private reading diary for statuses, manually entered chapter position, **half-star personal ratings and personal reviews**, with spoiler markers and JSON import/export. New `#taste` is transparent local recommendation matching from your positive ratings; it is not a paid-AI feature or real social collaborative filtering. No fake community reviews, popularity counts, scores, or profile activity are displayed.

**Current catalogue: 54 distinct real external series (17 Chinese, 13 Korean, 24 English)**. Verification is 8 multi-source corroborated, 32 single-source reviewed, 14 earlier records awaiting independent recheck. The series evidence ledger contains 48 source records. The original texts and translated chapters remain with their rightful publishers and are not indexed as full-text evidence.

Source scale infrastructure: `scripts/metadata_intake.py` streams Open Library CC0 bulk-work TSV dumps (.gz or .bz2), reads Wikidata SPARQL CC0 JSON, and accepts permissioned author CSV suggestions. **Every import is a quarantined candidate requiring provenance and identity review**, never an automatically published series. `docs/title-acquisition.md` explains the missing-source problem and the 100 → 1,000 → 10,000 quality gates. A GitHub Issue suggestion link is supplied on the site; it requires GitHub sign-in and does not silently collect data.

Authenticated public profiles, friends, global reviews, real popularity rankings, collaborative recommendations, active release tracking, automatic account sync and author publishing are **not implemented**; these require a secure database and rights/abuse handling.
