# ✦ Novalume

**An zero-paid-AI fiction discovery and reading platform that understands stories beyond genre labels.**

> Status: functioning static reader MVP (2026-11-04). Not yet a public publishing or commercial service.

## What works today

- Responsive premium-looking reader website, no external JavaScript dependencies.
- Natural-language intent matching and explainable tag/signal matches (a deterministic baseline, not an actual AI model).
- Search by plot dynamics, genre filters, book pages, reading-progress preservation, bookshelves, reader font scaling, theme switcher.
- Private local author draft creation with browser-only persistence (not a public upload service).
- 30 public-domain **candidate** discovery listings and source links. Each title is pending an edition-specific legal approval except the launch example.
- One actual first chapter of *Pride and Prejudice* available in the internal reader as a proof of the whole reading flow.
- Rights-gated reproducible edition importer, CI tests, static site build and a GitHub Pages deployment workflow.
- Zero-AI-cost lexical evidence index for hosted chapters (20 rule groups, evidence excerpts, source hashes and provenance), with clear unverified labels.
- Reader AI Desk: offline evidence search, privacy-preserving prompt / context JSON export, optional localhost Ollama / LM Studio integration. No cloud key collection.

## Run

Python 3.10+ and Node 20+ (only for the JS test runner; no npm packages required).

```sh
npm test
npm run build
npm run serve
# http://localhost:4173
```

## Import a legitimately cleared Standard Ebooks edition

1. Check original-work, edition and translation rights for the intended jurisdictions; inspect the exact upstream GitHub source repository.
2. Record a review and set `rights.decision=approved` for the specific entry in `content/rights_manifest.json`.
3. Run `python3 scripts/ingest_standardebooks.py <book-id>` (requires network); this checks review metadata and downloads an **upstream archive**, not a hotlink from the provider's reading pages.
4. Inspect generated `public/data/books/<book-id>.json`, chapter order, text quality and source checksum. Do not trust automated parsing blindly.
5. Run `npm test && npm run build`, then commit the reviewed results.

Do not publish unknown modern works, translated editions or fan translations without appropriate redistribution permissions. A candidate is never automatically approved merely because the author died long ago. Read [rights-policy](docs/rights-policy.md).

## Architecture & product direction

[Architecture](docs/architecture.md) · [Zero-cost intelligence policy](docs/zero-cost-intelligence.md) · [Rights & sourcing](docs/rights-policy.md) · [Milestone roadmap](docs/roadmap.md)

## Next development

A free deterministic chapter-evidence layer and reader AI Desk now work: users can export spoiler-limited context to their own assistant or explicitly call a local Ollama/LM Studio model. Narrative semantic verification, durable auth, cloud BYOK integration, public author publishing, moderation and payments are not implemented. We will not require or handle cloud AI keys on the static site. See the issue tracker and Google Sheet for acceptance criteria and dependencies.

## License

Site application code: MIT. Third-party or public-domain book content is governed by each work's rights record; the site software licence does **not** confer redistribution rights to book content.
