# Novalume — webnovel discovery, tracking and original reading

**Production:** https://novalume-story-search.vercel.app

## Direction (6 November 2026)
Novalume leads with a database of real serial fiction, then introduces readers to authorised reading and original author publishing. The old classics-only landing page is retained at `#read-here`, not the primary homepage.

The `#home` directory has **17 source-checked series** drawn from live Novel Updates and Royal Road series pages. Each entry includes a title, author, language, source profile URL, verified-at date, editorial summary, broad source-linked themes, and (where grounded) original-work publication status. No copied external chapters, borrowed cover art, fake reviews or made-up user statistics are present.

- Advanced catalogue search: words from title, author, aliases, theme and editorial short summary
- Language and work-status filters; reversible include/exclude themes
- Dedicated series pages with external source links, provenance, and list tracking
- Reader-owned local lists: plan, reading, completed, on hold, dropped; manual last-chapter and notes
- JSON export and import for personal lists; no cloud sync or pretend accounts
- `#read-here`: separate rights-reviewed public-domain reader (Dracula, Frankenstein, Pride and Prejudice first-chapter sample)
- `#assistant`: experimental private text search of **hosted** chapters only, not the wider webnovel directory
- `#studio`: browser-only drafts, not online publishing

The data source is `content/series_registry.json`; tests ensure external URLs are allowlisted and no book contents or arbitrary ratings are distributed. Build copies validated metadata to `dist/data/series_registry.json`.

## Next build milestones
1. Authenticated profiles and cloud-synced lists and notes (with privacy/deletion tools); then user lists, ratings and reviews with actual member provenance.
2. A scalable import and moderation pipeline to grow beyond the initial 17 independently sourced series, with duplicate handling, source attribution, status-change timestamps and safe external link checks.
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
