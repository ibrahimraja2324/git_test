# Novalume autonomous implementation rules

Read this at the beginning of every coding or scheduled run. It applies to Codex, ChatGPT and human contributors.

## Product contract

Build a real reader-first Webnovel alternative, not an AI demo. We are zero-paid-AI **by design**: core reading, publishing, static narrative indexing, search, recommendations, personal context and author workflows MUST work with no cloud model billing or user API keys. No Gemini-key harvesting, quota pooling, browser-exposed secret keys or hidden cloud inference. Optional personal model inference may run on a reader's local machine, or readers may copy/download their context into an AI provider they use independently. Never send a reader's content to third parties without an intentional, informed action.

## Canonical state

- Branch: `novalume-foundation` of `ibrahimraja2324/git_test` until a dedicated repo is explicitly available. Do not modify `main` or another project.
- Master task list: `ops/backlog.json` and native Google Sheet `https://docs.google.com/spreadsheets/d/1i9kd1tPfm8-7rE8HQmLpTFND6q9EjZC86EvVdHWk7uo/edit`. Keep IDs and statuses in sync; use `python3 scripts/assign_next.py` for an unblocked next task. Do not spawn duplicate trackers.
- Policies: `docs/zero-cost-intelligence.md`, `docs/rights-policy.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/source-integration.md`.

## Each run

1. Read the actual repo branch, task statuses, rights ledger and latest test results; do not claim work from old summaries that is no longer present.
2. Fix failures or legal blockers first. Then select the highest-impact unblocked milestone; break it into a substantial, testable vertical slice. Avoid planning-only, micro-asset and infinite validation loops.
3. Reuse safe, appropriately licensed open-source code and standard library functionality before writing new infrastructure. Do not scrape or copy Webnovel, Royal Road or fan translations. Public domain must be checked per edition and publishing territory. Unapproved catalogued books stay external links, not hosted files.
4. Implement, run `npm test && npm run build`, add adversarial tests for spoiler / copyright / key / rights leakage. Run browser smoke tests when available, otherwise document clearly that browser QA is not verified.
5. Commit actual source files and generated deterministic index to the canonical branch. Record commit SHA, validation evidence, and next actions in repository and the Sheet. Never say a deployed site exists without verified URL and HTTP/UI smoke test.
6. Do not claim that lexical clues prove a character relationship, event, payoff or trope. Promote only human-verified facts with chapter/paragraph citations, time bounds and provenance. Use held-out gold datasets to measure progress.

## Current hard limits and priorities (updated 2026-11-06)

- The real production site is deployed at https://novalume-story-search.vercel.app; it shows 54 source-only webnovel entries (8 cross-provider checked, 32 single-provider reviewed, 14 legacy review pending) and keeps the 3 rights-reviewed classical texts in a separate reader. Live mobile/browser QA remains unverified.
- Current platform AI API spending: $0. Any proposal requiring platform-paid AI must be redesigned, not simply deferred to the user's bill.
- Personal AI Desk supports prompt/JSON export and optional 127.0.0.1 Ollama/LM Studio; hosted cloud BYOK is NOT implemented and requires a separate security review.
- Major next milestones: NV-041 100+ lawful webnovel metadata profiles; NV-042 genuine social accounts and ratings; NV-043 author-owned publishing; NV-035 validated narrative extraction.
- ChatGPT recurring automation is not scheduled because the account's five-task limit is already reached. Do not promise unscheduled background execution.

## Definition of done

Working user journey + tests + source provenance / licence clearance + no paid AI dependencies + release-safe secrets + actual git commit + Sheet evidence. Partial milestones must be labeled partial. Never invent live users, legal clearances, browser test passes, or an automatic operation that was not scheduled.

## 2026-11-06 product decision: database-first webnovel audience

The public homepage at `#home` is a real, cited webnovel directory (54 real indexed entries in `content/series_registry.json`, with 14 legacy records still needing independent source reviews), not the old classics catalogue. `#read-here` is separate and only has rights-reviewed hosted texts. `#tracking` is a reader-owned, local-only reading list. Do not claim third-party chapters or cover art are hosted, and never fabricate ratings, member counts, latest releases, author permission or editorial trope verification. `#studio` remains private browser drafts until actual rights attestation, authentication, user storage and moderation are implemented.

## Chapter analysis scope and permission-first policy (2026-11-06)

- The chapter-analysis pipeline MUST NOT scrape Webnovel, Wuxiaworld, Royal Road or any other source of third-party copyrighted novels. Basic factual directory records and linked chapter text are separate permission categories.
- Current chapter-event source is 3 approved original-English public-domain books only, with 21 source-anchored **editorial samples** (not human-verified facts). Do not claim complete chapter-by-chapter analysis or live AI inference.
- `scripts/local_story_intelligence.py` runs either dry-run packet generation or optional local loopback Ollama inference; output is a private quarantine, not a published fact or model-training corpus. Manual acceptance must confirm textual entailment, causal relations and before/after claims.
- No publisher/author grants for copyrighted external books are currently present. Future non-public-domain analysis must have a revocable licence specifying processing, publication scope, model use and translation rights; strengthen authenticated access before indexing.
- Public API `/api/narrative` may only return safe title matches by default and chapter-limited compact editorial details after explicit opt-in. No unlicensed text, whole-corpus dump, or private candidate index to the client.
- Next priorities NV-046 permissions + author-authenticated ingestion and NV-047 independent quantitative narrative fact benchmark; do not substitute generic lexical tags for meaning.

## Static extraction and scale accuracy (2026-11-07)

- Three authorised hosted classics: 53 sections, 10,847 analysed sentence segments, 8,835 unverified static textual observations (GitHub CI build log 42235208056). The 54 external webnovel directory records are still metadata-only. No external chapters were downloaded, model-analysed or scraped.
- New deterministic layer: `scripts/static_story_observations.py`, `server/static_observation_service.mjs`, `api/observations.js`, and `src/app.js` search UI. Private snippets remain private and are limited by explicit reader-selected book and chapter in API outputs. Do not auto-promote deterministic labels to verified plot facts. Separate 21 editorial samples are NOT independently human reviewed.
- Directory pagination supports thousands but is synthetic-test coverage only. Never inflate public work count from benchmarks; now 54 actual records.
- Novel link metadata can be stored when lawfully sourced; public availability does NOT license programmatic text extraction for static, local-ML or remote-AI analysis. Respect provider terms and author/translator/publisher rights and revocation.

## Discovery-club UI and source intake (2026-11-07)

- Real catalogue expanded to **54 source-linked novels**: 17 Chinese, 13 Korean, 24 English; 8 multi-source verified, 32 with one reviewed source, 14 older source rechecks pending. Evidence source claims 48. Do not claim thousands, or inflate synthetic 3200-entry pagination fixtures.
- `#home` has curated real titles, reader-first editorial shelves and CSS-origin jacket placeholders, not publisher covers. `#tracking` includes device-local half-star ratings and spoiler-marked private reviews; `#taste` uses transparent genre overlap on rated works, not fake community scores or trained AI.
- `scripts/metadata_intake.py` supports Wikidata CC0 SPARQL JSON, streamed Open Library CC0 TSV dump and consenting-author CSV. Candidate outputs go to **review quarantine only**. Do not add unreviewed text/editions/adaptations to public catalogue, and do not bulk crawl providers without permitted feeds.
- A real-social beta now exists in code: src/community.js and db/novalume_social_v1.sql applied to user-owned Supabase general project. Profiles, reviews, follows, reports and opt-in private diary cloud backups are wired; no actual end-to-end signup was verified. Full moderation, account deletion and anti-spam controls are NOT implemented.
- See `docs/title-acquisition.md`. Keep updates in canonical tracker and follow NV-050 and NV-054 for real breadth and community.

## Live social database and source coverage update (7 Nov 2026)

- Six isolated, RLS-protected Novalume tables exist in Supabase project nsjczdmkifzxhiihfcrr. 54 verified source-linked works seeded, 0 real public profiles or reviews at first setup. Other apps' tables were left unchanged.
- src/community.js and src/community_config.js provide public/community browser routes using only an anon/public key. Actual email confirmation redirects need Supabase Authentication > URL Configuration to allow https://novalume-story-search.vercel.app; plugin cannot change it, and no browser-end-to-end signup was verified.
- The review/report/follow and cloud backup UI is real code with tests, not evidence of a populated social audience or fully moderated platform. Full account deletion and anti-spam still outstanding.
- scripts/import_cc0_webnovel_candidates.py validates a CC0-claimed Chinese candidate dataset (7,476 works advertised), and the real release was downloaded in GitHub Actions. 7,041 unverified candidate identities were staged (435 rejected); 2,810 placeholder author names and 97 possible non-novel categories require triage, while all original reading URLs remain unverified. 0 new public works from this data; directory count remains 54. Never claim 7,476, 24,639 or synthetic test records are live.

## 8 Nov 2026 supersession — actual release state

- Public Novalume directory: **56 verified linked works**, not 54. 19 Chinese, 13 Korean, 24 English. Evidence: 8 cross-source, 34 single-source, 14 legacy review pending. Claims: 50.
- Two staged CC0-claimed identities have been independently matched to canonical Fanqie/Tadu pages and promoted; 7,039 remain quarantined, unverified. Do not claim thousands are live.
- scripts/promote_reviewed_novels.py and content/source-review-decisions.json enforce explicit editor approval, original prose identity, exact matching author/title, source whitelist and no copied text. Real upstream data GitHub Action 42402778744 passed; no unverified approvals.
- db/novalume_suggestions_v1.sql applied to connected Supabase project. It is the seventh Novalume table, strict RLS; authenticated readers can submit/withdraw missing-original-novel metadata on #community, but cannot approve anything. Initially no real user suggestions.
- User login still needs Supabase Additional Redirect URL and end-to-end signup/mobile QA. Do not alter default Site URL in the shared project or create fake community activity.

## 8 November 2026 — ten-author-source editorial batch

Branch source now contains **66** real linked works (19 Chinese, 13 Korean, 34 English), **60** source claims; the 7,039 unverified Chinese candidates remain quarantined. Ten Royal Road author work pages were individually checked on 8 November; metadata and independent summaries are source-link-only. Status of nine is **Unknown** (eight STUB and one INACTIVE), not asserted to be completed/ongoing. The batch is documented in `docs/royalroad-editorial-batch-2026-11-08.md`. Database reconciliation and CI/deployment verification remain separate acceptance gates. Earlier 54/56 count notes are historical, not a reason to overwrite the latest batch.

## 8 November 2026 provisional title leads
A separate #leads route is for source-dataset-derived UNVERIFIED basic title/author leads only, generated from pinned upstream data. Never include these records in the verified series count, the novalume_works database, full-text intelligence or the cover subsystem. All routes must visibly disclose uncertain source identities and absent official links. See docs/scale-research-index.md and the title-leads CI action. Check the workflow actually publishes before claiming live results.

## Nov 8: cover-card regression repair
The real Discover UI is `src/discovery.js` (not `src/directory.js`).
Keep both views aligned. `src/cover_art.js` embeds Open Library *matched
edition* S/M covers as a third-party display source, with HTML safety,
404 fallback and no rehosting. Six approved edition identities exist;
unknown/unavailable edition images retain CSS jackets. No blanket rights
to hotlink arbitrary publisher cover images, and cover presence != verified
native series art. Do not count cover records as narrative knowledge.

## 8 Nov first-party reader evidence supersession
Product features/genre lists are not the differentiated asset. Real user-specific
expectation -> experienced outcome evidence, with chapter context and verified
work ID, can become valuable *if voluntarily contributed* and empirically shown
to improve recommendations. New private local reader experience module and
owner-only Supabase cloud backup. No silent collection/aggregate, no invented
users, no objective plot labels from one person's testimony. Current actual
profiles/reviews/diaries: zero. See docs/novalume-reader-evidence-moat.md.

## 8 November 2026: premise-lens factuality gate
src/premise_lens.js renders only claims validated from exact Novalume-authored summary phrases in content/premise_claims.json. These are premise hints, NOT experienced payoffs; do not call them reader evidence or chapter-confirmed story facts. Unsupported traits must abstain and genre-only baseline remains separate. A local-only reader discovery brief may be seeded from their explicit private wanted facets. Unit tests and scripts/test_premise_claims.py enforce source matching. No metrics or users may be invented.

## Opt-in reader-evidence channel (8 November 2026)
Distinct public.novalume_consented_outcomes has strict owner-only RLS, client side never pushes private notes or precise chapter numbers, and explicit contribution plus withdrawal actions. Account ID is stored internally (pseudonymous, not fully anonymous). No silent backup reuse, public ratings, aggregate RPC or visitor surveillance. New SQL check constraints require taxonomy codes and judged wanted dimensions. Test actual security and user sign-in before claiming live end-to-end user contributions. The source-of-truth release is db/novalume_consented_outcomes_v1.sql.

## 8 Nov: measured cover UX repair and acquisition
Do not serve -S.jpg as a whole cover: medium M tile and large L hero/detail
with srcset for retina, object-fit:contain (no art cropping), browser-direct
Open Library, fallback if broken. The previous 7/66 baseline was inadequate.
One more independently matched visible Open Library edition of Dungeon Life
raises coverage to 8/66. Research_cover_candidates.py makes rate-limited
Open Library metadata SEARCH ONLY to generate review proposals; never
automatically publishes, scrapes publisher artwork or downloads OL cover
files. Candidate count is not verified art count. Production CI and visual QA
remain separate gates.

## 8 Nov: Open Library cover-ID work matches
A rate-limited one-time Open Library search found exactly three additional English novels with exact title/author and a real cover_i: The Perfect Run (14811808), Beware of Chicken (14718151), Mark of the Fool (14628017). Promoted only these to public coverArt using strict numeric ID + OL work URL validation, for 11/66 registered. No other 23 English records matched with a cover. Do not call those 55 missing records fixed. Artwork still browser-direct and imagery may be missing at runtime.

## Image UX smoke 8 November
Browser run 42426054617 exposed a mobile omission: the floating cover section was hidden at narrow widths, so readers saw no featured imagery. The new mobile cover row gives three genuine matched edition previews. Desktop hero positions are prioritised by observed availability. Browser screenshots are the acceptance gate, not mere JS tests. Some Open Library original covers are below 200 pixels wide and will remain soft at larger display sizes even when requesting L.
