# Novalume static story evidence — the actual implemented pipeline

## Why this exists

Novel Updates-style discovery relies on title, author, genres, community tags and links. Novalume
will additionally search *what happens inside a story* — but only where the rights holder permits
chapter processing. **A linked chapter on a legitimate publisher's website is not automatically
a right to download, analyse or create a permanent searchable plot-derived dataset.**

Our product uses two separate datasets:
- **Public bibliographic directory** — currently 43 real webnovels and links; no chapter text.
- **Permitted text intelligence** — 3 rights-approved classic editions, 53 sections, 10,847
  sentence segments, 8,835 deterministic observations, 21 manually authored editorial
  source-anchor examples. External books are excluded entirely.

## Evidence representation (open vocabulary, temporal, uncertainty-aware)

From each sentence in the permitted texts, \`scripts/static_story_observations.py\` stores:

| Dimension | Stored evidence | What NOT to infer |
| --- | --- | --- |
| Provenance | edition/book ID, chapter, paragraph, byte/character offset, source paragraph and sentence SHA256 | A hash isn't semantic entailment |
| Language | candidate action words, topical terms, possible name mentions | A mention may not be a character or a resolved pronoun |
| Narrative lens | communication, knowledge, beliefs, public reaction, relationships, status/progression, decisions, harm, movement, loss, supernatural cues | Ranking hints are not conclusive trope tags |
| Epistemics | negation, hypothetical/modal, reported speech, possible dialogue, question indicators | Quoted speculation isn't something that actually happened |
| Change hints | explicit numerical or rank-like expressions and verbs denoting state change | Do not fabricate power levels or before/after values |
| Passage evidence | capped 195-character snippet, passage location, source fingerprint | Cannot establish motivation, narrator truth, witnesses or consequences |
| Verification | "literal-text-candidate-not-confirmed-plot-fact" | Never mark as fact without separate review |

No taxonomy is required to contain every future webnovel trope. Shortlists of ranking cues only
make observed terms easier to retrieve. Discoveries outside that list remain available in the
open terms and actual source passages.

## Current code and search flow

- \`npm run build\`: rights-gated deterministic analysis of all imported chapters, writes private
  \`server/private/static_observations/<book>.json\`, emits *counts only* to
  \`public/data/static_observation_stats.json\`.
- \`GET /api/observations?q=...\`: by default returns book titles, never passage text.
- Explicit \`bookId\`, \`reveal=1\`, \`chapterLimit=N\` unlocks at most five 195-character
  source-grounded clues from chapters at or before N, and labels them UNVERIFIED.
- \`/#assistant\`: public-domain static-clue search and its chapter cutoff; the 21 editorial
  reviewed-anchor samples live separately. The existing text-phrase/lexical search is weaker.
- Directory search is paginated to 24 records/page and is unit-tested against 3,200 synthetic
  items, but **the production directory still holds only 43 actual webnovels**. Do not count
  synthetic pagination fixtures as records.

**Measured CI result** (GitHub Actions \`42235208056\`):
\`analysedBooks=3, analysedChapters=53, observedSentences=10847, candidateObservations=8835\`.

This means 8,835 observed *sentence candidates*, not 8,835 verified relationships, plot events
or semantic facts. Inference may be wrong about the acting person, timing, irony, or motivation.

## What genuinely comprehensive story search would require

A self-expanding, evidence-linked story model with independently tested inference:

- Entity registry with aliases, pronoun/coreference identity, impersonation/disguises and
  character state at a given chapter.
- Event timeline recording observable actor, verb, target, place, chapter order and time shifts;
  distinguish real, quoted, remembered, imagined, proposed, denied, and misleading versions.
- Knowledge graph answering *who knows what by chapter N?*; witnesses, informants, secrets,
  rumours, reputational cascades, bounties/public responses and belief reversals.
- Powers and earned progression: realm/level/skill name and values, costs, training sources,
  comparative strength, setbacks, hard evidence and known progression rules.
- Cause/consequence arcs: commitments, goals, obstacles, decision, result, costs,
  revelation, reversal, public recognition and longer-term impact. An ordered pair is
  not necessarily causally related.
- Relationship graphs: family, betrayal, romance, romance misunderstanding, allies, rivals,
  mentor, subordinate, institutional affiliations, changes and opposing viewpoints.
- Pacing/reader experience: conflict density, payoff timing, scene shifts, cliffhangers,
  repeated plot cycles and intensity changes. These are contestable interpretations,
  not necessarily objective measures.
- Explicit confidence, reviewer provenance, exceptions, version invalidation and
  spoiler-safe search by a reader's chapter limit.

These modules should not be filled by word-matching alone. The static layer is **a retrieval memory
for a future interpretation and human QA system**, not a substitute for one.

## Lawful large-scale ingestion

- Legitimate source links do not grant novel-text reuse or bulk collection rights.
- Permissioned publisher feeds or author-uploaded manuscripts can enable content analysis,
  subject to storage, processing, derived-index publication, revision and takedown terms.
- Public domain and truly permissive works can be used when edition, translation and
  jurisdiction are checked.
- The user can maintain private personal reading notes from lawful browsing. An operator-built
  site-wide searchable extraction service is a different use, requiring independent permissions
  and platform terms compliance.
- The novel's original Chinese/Korean text, English translation and platform presentation
  may have separate rights holders.

Australian position (as of Nov 2026):
https://ministers.ag.gov.au/media-centre/albanese-government-ensure-australia-prepared-future-copyright-challenges-emerging-ai-26-10-2025

Wuxiaworld terms: https://www.wuxiaworld.com/terms-of-service

Wikidata CC0 bulk metadata (no plot chapters):
https://www.wikidata.org/wiki/Help:Data_access

Next: improve false-positive evaluation, add genuinely source-verified external works to the
directory at scale and seek author/publisher opt-in for copyrighted full-chapter analysis.
