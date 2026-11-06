# Novalume — next actionable work

## NV-041 (in progress): Scale rights-safe discovery to 100+ webnovels

Current status: 43 indexed works (10 Chinese, 9 Korean, 24 English); 8 independently corroborated across providers, 21 single-source reviewed, 14 legacy source checks pending. This is not 43 fully verified profiles.

Upcoming substantial implementation:
1. Independently review the remaining 14 older source links and completion status. Do not equate original-work status with translation or source-site stub availability.
2. Add at least 57 more separately sourced novels using Wikidata CC0 facts, Open Library bulk dump bibliographic records, and manually reviewed or permissioned publisher/author references, not prohibited automated scraping.
3. Expand per-field evidence, source disagreement, entity aliases, adaptations vs original work identity, and stale checks without blindly merging title collisions.
4. Implement a metadata correction/removal process, public licences and permissioned author submissions before user-generated crowdsourcing.

Already delivered:
- Source registry: content/series_registry.json (43 works).
- Independent evidence ledger: content/series_evidence.json (37 factual source references).
- Deterministic cross-platform reconciler: scripts/fuse_series_metadata.py.
- Offline CC0 Wikidata quarantine adapter: scripts/propose_wikidata.py.
- Per-work provenance and availability shown on source pages.
- GitHub CI passed and Vercel production marked READY. Live browser smoke still needs verification.

Research, provider restrictions, and build policies: docs/source-integration.md.
