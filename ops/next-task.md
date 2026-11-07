# Novalume — next highest-impact tasks (8 Nov 2026)

REPO directory books: 66 after the independently checked 10-title Royal Road batch (live deployment not separately verified). Chinese 19, Korean 13, English 24. 50 source claims.
Source research: 7,041 quarantine identities, 2 publisher-linked (now included in public 56), 7,039 not verified.
Community beta: seven isolated RLS Supabase tables; 66 repo series; 0 fabricated reviews/users; new private title-suggestion form and withdrawal queue.

## NV-056 authentication release gate
Set https://novalume-story-search.vercel.app/** under Additional Redirect URLs in shared Supabase Auth project nsjczdmkifzxhiihfcrr. DO NOT change existing Site URL. Verify email and real first-user signup, follow, review, private diary, moderation, mobile browser flow and account deletion. The connector cannot change the URL setting.

## NV-050 + NV-060 real catalogue
Use the source-review approval CLI and decisions manifest to research 7,039 pending identities, prioritise genuine original publisher links, independently check title/author, approve in small batches and sync source registry+evidence and Supabase works. Avoid pretending the candidate snapshot is 7,039 usable novels. A public title suggestion is only a private review request, never auto-approved.

## NV-051 narrative detail
Permissioned manuscript text analysis and independently validated plot knowledge remain distinct from bibliographic metadata. No third-party chapters mirrored.

See docs/publisher-source-review.md, docs/title-acquisition.md, docs/social-launch.md and GitHub Action 42402778744.

## NV-050 additional batch 8 November 2026
Added ten manually checked Royal Road links (one explicitly completed; nine status-unknown because of STUB/INACTIVE). The Git branch directory moves from 56 to 66 records, evidence claims from 50 to 60. See docs/royalroad-editorial-batch-2026-11-08.md. The 7,039 PanguDawn candidates remain in quarantine. Sync the ten records to Supabase works and verify CI/deployment separately.

## 8 Nov catalogue scale correction
Implemented a separate optional #leads route with pinned external dataset converter and quality filter; distinct research leads are NOT verified works. Trigger and verify the GitHub Actions novalume-title-leads workflow, resulting public/data/candidate_index.json count, and Vercel deployment (previously blocked by team authorization). Work towards licensed author/publisher feeds for genuinely verified 1,000+ original webnovels and cover permission coverage.

## Reader understanding / data moat
Ship and validate the reader expectation/outcome UI on #series and #taste.
Create and security-audit only isolated novalume_reader_experience table.
Do real browser QA. Pilot with authentic opt-in readers to verify that the
feedback provides value and improves recommendations vs genre-only.
No engagement hacks or fake submissions. Cloud backup is opt-in only.

## Reader-first discovery feedback experiment
Premise lens allows self-selected reader wants to match exact Novalume-authored summary snippets, with explicit unknowns and genre-only comparison. Validate production deployment and real mobile usability. Real reader feedback count is 0; do not claim uplift until 20+ authentic discovery attempts with explicit outcomes. Next priority: a revocable, purpose-limited opt-in contribution path so experience labels can improve future reader matching without exposing private notes. See docs/premise-lens-v1.md.

## Opt-in first-party learning acquisition
Novalume now has an explicit share-with-consent / withdraw-all channel for judged reader experiences; fine-grained notes and exact chapters remain private. Validate SQL schema, per-user RLS, and production release. Actual participants and contributions remain ZERO unless verified otherwise. Next: allow genuinely consenting readers to complete end-to-end signup and contribution; measure if those signals improve held-out recommendations relative to genre-only baseline without exposing identifiable micro-cohorts.

## Cover image visibility and quality
Prior 7/66 mapping plus S-image upscaling/cropping harmed UX. Fixed M/L
display and object-fit contain and added Dungeon Life edition to reach 8/66
registered. One-time GitHub Actions cover research stores unverified matches
under ops/cover-research-candidates.json. REVIEW candidate identities and
actual image availability, then promote only verified covers. Explicitly
measure registered/visibly-loaded cover rate separately. Do not label
research proposals as usable images. Mobile screenshot QA still required.

## Open Library source findings
Research action 42425662257 SUCCESS: 26 previously uncovered English records scanned, only 3 exact title+author work-cover IDs (see ops/cover-research-candidates.json), zero network errors. Now 11/66 public cover metadata records. To reach majority of 66 with authentic covers requires explicit platform/publisher-provided image permission or another licensed source, NOT invented ISBNs, random image search, generic scraped CDN URLs, or repeated Open Library crawls. Manually QA actual image loads and responsive cover aspect ratios.

## Browser evidence for covers
Run 42426054617 Chromium reported mobile homepage without featured covers, desktop Mother of Learning fallback and an original 178-pixel cover stretched into a 274-pixel jacket. Added mobile cover row and desktop composition update. Rerun real browser screenshots before claiming visual repair. 11/66 cover records remain the source-coverage limit.
