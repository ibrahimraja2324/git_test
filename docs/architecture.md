# Novalume architecture · phase 1

## Executed foundations (2026-11-04)

- Real static reader application with catalogue, intent matching, collections, reader, local progress, private author draft, rights disclosure.
- Source-backed discovery entries derived from `content/rights_manifest.json`, not arbitrary copied books.
- Hosted chapter JSON gated by a reviewed rights decision plus a local verified asset.
- Tests for semantic-intent baseline, rights gate, catalogue consistency, basic XHTML extraction.
- Repeatable build and GitHub Actions for CI and the *manual* rights-approved importer.

## Actual boundaries

This is a functional **static reader MVP**, not a production social network. There is no account service, production author ingestion, paid chapters, moderation operations, vector database, Gemini API integration, or persistent server-side user profiles. Private drafts and bookmarks live in the browser's localStorage and are not backed up. Story signals are editorially curated, not AI-derived until the evidence extraction service is completed. Only one chapter is currently hosted, not a complete first ebook. The other discovery entries are outside-source links, not hosted titles.

## Target structure

1. **Storage + rights.** Edition ledger records original work, source edition, translations, reviewer, jurisdiction, status and reversible takedown state. Deny by default for any unreviewed edition.
2. **Narrative pipeline.** Ingest chapter text (consent/rights check), split semantic scenes, extract time-qualified entities, events, relationships, revelations, mechanics and evidence spans; run cross-chapter reconciliation and human QA. Persist model version, extraction status, confidence and provenance.
3. **Search.** Hybrid keyword + dense embeddings + temporal event graph. Apply legal availability, content preferences and spoiler boundaries *before* retrieval; explain matches with sourced event evidence.
4. **Reader.** Anonymous session then authenticated accounts; user-controlled preferences, reading state, social interactions, access control. Never put premium chapter source inside publicly downloadable static data.
5. **Author console.** Manuscript upload pipeline, author terms, moderation and takedown control, non-exclusive rights by default, editor, continuity compiler, revenue dashboard.
6. **Commercial layer.** Authenticated entitlements, pricing, creator payout ledger, chargebacks, tax handling and audit logs. No dynamic reader-specific exploitative pricing.

## Policy decisions

- Users never surrender AI API credentials to harvest or pool free-tier compute.
- Reader BYOK, if built, should use an explicit provider-approved proxy or short-lived credential mechanism with consent and encryption, not public client-side storage of private keys.
- Rights status and reader entitlements are hard gates outside any LLM prompt.
- Privacy: preferences opt-in and export/delete support; minimise behaviour profiling by default.
- AI-generated spam, fake engagement and plagiarised stories require moderation and appeals.

## Starting point

`npm run build && npm run serve` (or `npm run dev`); visit http://localhost:4173. Zero Node dependencies.

## Deployment

Build generates `dist/`; deploy it to GitHub Pages or any static host. Enable Pages and choose GitHub Actions in repo settings. Existing `.github/workflows/pages.yml` targets `main`; update if working in an isolated branch. Production deployment verification must be done separately.
