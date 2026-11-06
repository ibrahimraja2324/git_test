# Novalume — active next tasks (6 November 2026)

## NV-046: permission-first full-text narrative intelligence

Current substantive implementation: a rights-gated analysis pipeline and 21 anchored
editorial event samples across three approved classics, plus a private source-event
search API and explicit chapter-cutoff UI. GitHub tests pass.

Next completion requirements:
1. Obtain scoped, revocable permission to process original webnovel manuscripts directly
   from authors/publishers, including translated-edition rights where relevant.
2. Run scripts/local_story_intelligence.py in local Ollama mode against an approved corpus
   end to end, producing quarantined proposals. The adapter is coded but NOT executed
   on the user's local hardware in this release.
3. Add temporal linking, character identity disambiguation, power progression units
   and audience reactions; conduct independent evidence confirmation before publication.
4. Establish source revocation and secure deletion procedures for copyrighted manuscripts.

## NV-047: independent gold evaluation

Build 100+ evidence-backed real-text scenarios across rights-approved novels. Measure
false positives, claim entailment, chronology, subject/witness correctness and spoiler
leakage. The 21 editorial samples are not such a benchmark.

## NV-041: external webnovel directory growth

Still at 43 metadata-only indexed entries, with 14 awaiting independent recheck.
Continue 100+ source-legal coverage, but do not scrape third-party chapters or claim
that metadata equals full-text semantic verification.

Reference docs/narrative-intelligence.md and docs/source-integration.md.
