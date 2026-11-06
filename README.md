# Novalume — webnovel discovery, tracking and original reading

**Production:** https://novalume-story-search.vercel.app

## Direction (6 November 2026)
Novalume leads with a database of real serial fiction, then introduces readers to authorised reading and original author publishing. The old classics-only landing page is retained at `#read-here`, not the primary homepage.

The `#home` directory has **43 indexed webnovels** from Novel Updates, Royal Road, licensed Wuxiaworld and two CC0 Wikidata reference records. Coverage: 8 series corroborated across independent providers, 21 with one reviewed source, 14 legacy records awaiting an independent source check. Old unverified completion statuses have been downgraded to Unknown. The records use human-composed short descriptions. No copied external chapters, borrowed cover art, fake reviews or made-up user statistics are present.

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
2. A scalable import and moderation pipeline to grow beyond the 43 current directory records to 100+, with duplicate handling, source attribution, status-change timestamps and safe external link checks.
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
