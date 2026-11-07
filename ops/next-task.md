# Novalume — next substantial milestones (7 November 2026)

Current production candidate: 54 real indexed webnovels (17 Chinese, 13 Korean, 24 English);
8 cross-source corroborated, 32 one-source reviewed, 14 older records needing rechecks.
48 factual claims. Distinct editorial cover UI and device-local private reviews and taste.

## NV-050 — acquire 1,000+ real published webnovels, not fabricated stats

An actual three-source intake parser now exists at scripts/metadata_intake.py:
- Wikidata CC0 SPARQL JSON exports, using docs/wikidata-webfiction.rq
- Open Library monthly CC0 dump streaming (.gz/.bz2) for *works* and edition crosswalk
- Rights-claimed author CSV / future licensed publisher feeds

All outputs remain quarantined. Need to download real permissible sources, evaluate work vs
adaptation identity, author and native title collisions, verify official links, then gradually
approve distinct verified serial works. Current 54 is not 1,000.

## NV-054 — actual Letterboxd-style community

Device-local reading logs, half-star ratings and reviews work now. Next is secure sign-in,
cloud profiles, actual public review submissions, per-review spoiler handling, deletion,
social lists and a user-taste graph. No fake social feed or invented global scores.

## NV-051 — novel-specific deep narrative search accuracy

Separate original-text analysis requires explicit rights; 8,835 unverified static clues
from three cleared classics are not 8,835 proven events. Continue evidence checking,
factual event relation extraction, negative queries and chapter spoiler protections.

Current site: https://novalume-story-search.vercel.app
See docs/title-acquisition.md and docs/source-integration.md.
