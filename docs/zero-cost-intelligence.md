# Zero-paid-AI architecture contract (2026-11-04)

## Non-negotiable

Novalume's default browsing, reader, author drafts, rights-gated publishing, library, matching, evidence indexing and story context export MUST work with **$0 paid AI expenditure** and **without a user AI account**. Never silently invoke paid inference or pressure users to link credentials to read ordinary chapters. Our platform does not harvest free Gemini API keys or pool user quotas to perform shared compute. Credits and premium chapters must have their own viable economics rather than claiming AI cost savings pay author royalties.

The repository must not contain a hardcoded vendor API key or an unapproved billable AI request. The `scripts/check_no_paid_ai.py` guard runs in CI. Avoid subscription-required SDK dependencies and external AI calls at build time.

## Shipped static pipeline

`content/narrative_lexicon.json` -> `scripts/build_story_index.py` -> `public/data/story_index.json` + `public/data/knowledge/<reviewed-book>.json` -> `src/knowledge.js` -> UI.

The zero-LLM deterministic extractor uses 20 taxonomy categories and word-boundary phrase matches, simple explicit negation guardrails, paragraph source pointers, SHA256 provenance, per-chapter sampling and source-file hashes. It only processes locally hosted rights-approved texts and must never infer copyright status from text or dates. A matched phrase is an **unverified lexical clue**, not proof of any event; facts and payoffs require explicit annotation/review for stronger labels.

The site reads compact aggregate counts for optional weak discovery boosting. On-demand per-book knowledge is filtered to the reader's *saved* chapter limit before constructing any AI context payload. There is no promise of hiding the existence of future public chapters; a fully static public site cannot securely hide public assets or premium content.

## Reader-provided assistants

- **Universal portability (works now):** Users can copy a self-contained prompt or download a small JSON context object with sources and caution text, then paste it into any AI app. No credentials leave the provider's app.
- **Own local inference (works when configured):** Read-only request to 127.0.0.1 Ollama (11434) or LM Studio (1234), only after explicit user click; no keys. Local server must remain bound to loopback and configured securely. Browser CORS and local-network access restrictions may prevent requests. AI responses are not trusted as story facts.
- **Cloud BYOK (not implemented):** Needs provider-specific secure OAuth/proxy architecture and actual permission/terms review. Never ask readers to enter a secret cloud API key into our public static site or store it in localStorage. Google discourages client-side Gemini API keys: https://ai.google.dev/gemini-api/docs/api-key.

## Evolving beyond lexical matching

Do not mistake complexity for quality. Build an annotation schema for author-approved character aliases, relationships and chronology. Add deterministic entity disambiguation, negation and quotation handling, and temporal event annotations. Evaluate it with a human-labeled gold set before declaring a new signal reliable. Every unverified fact must retain its source evidence and version. Prefer cheap CPU processing of licensed data once and indexing for reuse.

### Quality benchmarks before promoting a heuristic

- Macro precision/recall, false positives per 1,000 paragraphs, and coverage by genre/era.
- Direct quotes vs narrator assertions, negation, hypothetical dialogue, retrospective narration and ambiguous identities.
- Indexed source integrity on revision, removal and takedown.
- Spoiler-limited context tests, including intentional attempts to request future events.
- Import size and build time for a 3,000-chapter story; shard index as needed.
- User-task success vs the simpler keyword baseline, not imagined 'perfection'.

## Cost ledger

| Operation | Platform AI inference cost | Required services |
|---|---:|---|
| Index approved books | $0 | Python stdlib |
| Reader discovery and matching | $0 | Browser JavaScript |
| Story evidence search | $0 | Browser JavaScript |
| Context JSON export | $0 | Browser JavaScript |
| Local Ollama/LM Studio inference | $0 paid model API | Reader computer/power, installed model |
| External ChatGPT/Gemini workflow | $0 to Novalume | Reader independently controls service, terms and available credits |

The site itself may still incur hosting, domain, storage, support and compliance costs at scale; *zero AI inference cost* is not the same as *zero operating cost*.
