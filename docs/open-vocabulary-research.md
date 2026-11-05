# Narrative Intelligence v2: discovery must not be limited by a predefined tag list

**Status 2026-11-04: first implementation, explicitly unverified.** The system is **not** a semantic understanding engine yet. It is a deterministic, evidence-linked substrate to support long-term learning and a reader-owned AI tool interface.

## Two complementary indexes

1. **Private complete lexical index.** Every qualifying paragraph of every approved, hosted edition is ingested into SQLite FTS5. This supports arbitrary new search terms, including terms that appear only once, and does not restrict results to a genre or trope inventory. Stored in `server/private/narrative.sqlite`, never copied to static assets. FTS5 is an index, not proof of meaning.
2. **Private evolving narrative candidate index.** Unsupervised 1–5-word observed phrases, proposed proper names, and same-paragraph entity co-mentions are computed from the words of the manuscript. They include source hashes, chapter and paragraph positions and observation confidence labels. They are *candidates*, not facts. The top 260 phrases are compact promotion candidates for first launch; this **does not** cap searchable vocabulary because every source paragraph is indexed in FTS5. Increase/rework candidate selection only after evidence-driven evaluation.
3. **Public spoiler-safe book counts.** `public/data/index_stats.json` contains counts and hashes, not plot observations or future events. The richer private index is generated at deploy time. A public Git repository must never track private JSON, database, or lexical observations.

## What we can and cannot know without AI

Can discover arbitrary *surface* phrases, new named entities and candidate shared scenes, and connect them to the source paragraphs. Can index whatever a novel says without asking the author to enter tags. Cannot reliably know motives, reveal timing, ontology-level synonyms, causal relationships, betrayal, whether a quote is truthful, character knowledge, narrator reliability, payoffs or sustained quality. These require stronger extraction, author corrections or permitted reader-provided AI analysis with human verification.

**Crucial distinction:** when a reader connects an external AI, it may formulate a detailed tool query. The Novalume server searches privately and returns safe titles, not private passages or relation graphs. A match implies some relevance to the requested topic, and adaptive probing can still reveal hints; zero spoiler leakage from arbitrary queries is impossible. Never claim cryptographic secrecy or perfectly spoiler-proof matching.

## Dynamic growth / new concepts

- Each version of the manuscript creates new evidence. Full text is reindexed deterministically; future scale uses immutable chapter shards and incremental updates.
- Observed phrases are automatically eligible for search with no manual genre tags. Frequent recurring phrases can be promoted into a reader-facing controlled label after independent validation.
- A user can express any query in natural language. The BYO-AI MCP tool accepts `query`, `interests`, `avoid` and optional `requiredConcepts`. Strict clauses are lexical constraints, not semantic reasoning; the tool discloses this.
- New natural-language synonyms can be reviewed from **consented, aggregated** searches and added to an alias registry without discarding original corpus terms. Do not automatically trust user prompts as ontology updates.
- Every phrase retains provenance and verification labels; future systems should track character entity IDs, alias histories, hypothetical vs factual scenes, arc boundaries, source revisions, and chapter-timed outcomes.

## Real prose benchmark (first cut)

`tests/fixtures/verified_public_domain_excerpts.json` samples actual Standard Ebooks original English excerpts from six chapters across *Pride and Prejudice*, *Dracula*, and *The Time Machine* (24 total paragraphs). They are source-cited excerpt snippets for method evaluation, **not** published full editions. `python3 scripts/evaluate_dynamic.py` runs six deliberately answerable smoke queries; this sample achieved 6/6 correct top-1 classifications. These deliberately chosen queries do **not** demonstrate accuracy for reader-like hard requests. The initial evaluation is small, unblinded and biased toward identifying unique words/characters; do not present 100% as a product performance claim.

Next benchmark: 100+ human-labeled claims across multiple genres and eras, adversarial negation, hypothetical statements, future revelations, entity aliases, narrative role changes, synonyms, repeated identical descriptions, and genuinely absent trope queries. Report precision, recall, calibration, and spoiler-leak incidence before promoting automatic event facts.

## Server-side AI tool and security

`GET /api/search?q=...` offers human-friendly read-only ranking for hosted, rights-approved novels. `POST /api/mcp` offers an **experimental** MCP `search_novalume` tool for reader-controlled assistants that support custom remote MCP. The model is never given a dump of the private index. Both responses contain public book metadata and **tentative** match strength labels only. The server does not collect any Gemini/OpenAI keys.

The prototype has no authentication, global rate limits, abuse detection, contractual guarantees or hosted database — all required before public scaling. Tools should not access protected/premium chapters without user auth, explicit entitlements and server-enforced reading progress. The current catalogue contains only public-domain titles, so it does not demonstrate access control for commercial novels.

## Zero-cost AI assurance

No paid AI inference calls are made by the platform. The user can optionally use their own model; no provider receives hidden plot text through `search_novalume`. Standard CPU and hosting costs remain.

## 2026-11-06: Position-aware private lexical constraints

The private index now includes a compact `passageTerms` record (chapter, paragraph, distinct tokens) for every eligible paragraph; it is created from approved hosted content and excluded from the public build. Unlike the previous book-wide bag-of-words strict check, each `requiredConcepts` clause now requires all meaningful terms to co-occur inside **one indexed paragraph**. The optional `samePassage=true` flag requires all clauses to occur in the same paragraph. Exclusions are only soft score penalties when the entire avoided phrase's terms co-occur in an observed paragraph. Legacy indexes fall back conservatively to same-phrase evidence rather than accepting unrelated terms from different locations.

**Limitations:** Paragraph co-location is not a scene, chronology, verified event, relationship, successful resolution, character identity, negation, or semantic equivalence. The index does not provide guarantees that a trope is absent; a negative filter is a preference, not a rights/security enforcement. Paragraph tokens and source locations remain private. These are structural regression tests, not human-validated accuracy results. More representative real-prose annotation remains required for NV-032 and event verification remains required for NV-035.
