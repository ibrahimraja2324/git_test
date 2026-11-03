# Milestone roadmap — self-assignment contract

**Principle:** Every run ships a coherent vertical slice before any prose-only planning. Rights safety and production security are non-negotiable gates.

| Phase | Milestone | Completion evidence |
|---|---|---|
| P0 | Reader foundation | Built and tested local static site, functioning chapter reader |
| P0 | Rights-gated discovery catalogue | 30 candidates indexed, unapproved titles not hosted |
| P1 | Catalog integrity and full-book ingestion | ≥10 reviewed titles, full chapter text, hashes, legal sign-offs, automated parse QA |
| P1 | Supabase/Auth and durable reading state | Signed-in users, policy-backed RLS, cross-device restore, account delete |
| P1 | Real author submissions | Upload, drafts, chapter scheduling, clear publication agreement, moderation |
| P1 | Evidence-backed story DNA | Stable chapter/entity/event schemas; human-validated extraction reliability |
| P2 | Hybrid narrative retrieval | Evaluation dataset; qualified match rate beating keyword/tag baseline |
| P2 | Reader AI companion | Spoiler boundary tests, chapter-cited answers, safe credentials |
| P2 | Writer continuity compiler | Contextual flags, author controls, false-positive measurement |
| P2 | Creator-reader matching | Controlled exploration, retention fairness, anti-manipulation metrics |
| P3 | Payments/monetisation | Licensed premium content, verified entitlements, compliant creator payouts |
| P3 | Translation, audio, communities | Each separately consented, moderated, and rights-cleared |

## Run algorithm

1. Read current repository, CI, rights manifest, issue backlog, and Google Sheet tracker.
2. Fix broken build or legal blocker first. Otherwise select highest-priority actionable task with no active dependency and significant user impact.
3. Research audited source implementations (reuse compatible libraries), implement integrated code and acceptance tests.
4. Build, exercise user journey, audit output, push to the canonical repository, and log commit, tests, bugs and next step in issue + Sheet.
5. Reprioritise based on validated reader/author outcomes. Never fabricate live traffic, approvals, credentials, deployed URLs or successful tests.
6. Stay within the same repository/workbook; don't spawn duplicate project trackers or new scheduled tasks.

## Two separate funnels

- **Reader acquisition:** rights-reviewed catalogue + credible plot search + reader functionality + organic landing content.
- **Original author acquisition:** honest terms, import/export, audience matching, preview submissions, trust and moderation.

## Stop-the-line triggers

Unlicensed copied text, exposed credentials, an auth bypass, unsafe payment handling, privacy violation, unverified import, or falsely presented AI metadata. Block release, correct issue, document cause.
