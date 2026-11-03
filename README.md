# ✦ Novalume

**An AI-ready fiction discovery and reading platform that understands stories beyond genre labels.**

> Status: functioning static reader MVP (2026-11-04). Not yet a public publishing or commercial service.

## What works today

- Responsive premium-looking reader website, no external JavaScript dependencies.
- Natural-language intent matching and explainable tag/signal matches (a deterministic baseline, not an actual AI model).
- Search by plot dynamics, genre filters, book pages, reading-progress preservation, bookshelves, reader font scaling, theme switcher.
- Private local author draft creation with browser-only persistence (not a public upload service).
- 30 public-domain **candidate** discovery listings and source links. Each title is pending an edition-specific legal approval except the launch example.
- One actual first chapter of *Pride and Prejudice* available in the internal reader as a proof of the whole reading flow.
- Rights-gated reproducible edition importer, CI tests, static site build and a GitHub Pages deployment workflow.

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

[Architecture](docs/architecture.md) · [Rights & sourcing](docs/rights-policy.md) · [Milestone roadmap](docs/roadmap.md)

## Next development

The structured narrative event graph, live Gemini integration, durable auth, recommendations from chapter evidence, author publishing workflow, moderation and payments are not implemented yet. See [the canonical build and rights tracker](https://docs.google.com/spreadsheets/d/1i9kd1tPfm8-7rE8HQmLpTFND6q9EjZC86EvVdHWk7uo/edit), `ops/backlog.json` and `ops/next-task.md` for acceptance criteria and dependencies.

## Project status and handoff

Source currently lives only on an isolated `novalume-foundation` branch in an existing test repository, not a dedicated project repository. The website has not been publicly deployed, and the full-book import queue remains pending legal verification. Scheduled ChatGPT automation could not be installed because the user's account has reached its five-task limit; existing automations were not changed. `scripts/assign_next.py` deterministically selects the next unblocked milestone for manual or permitted scheduled runs.

## License

Site application code: MIT. Third-party or public-domain book content is governed by each work's rights record; the site software licence does **not** confer redistribution rights to book content.
