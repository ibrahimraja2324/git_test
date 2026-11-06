# Chapter-level story intelligence (rights-cleared source only)

## Goal

Make Novalume genuinely better than generic genre-tags and list sites, without
mistaking textual overlap or speculative LLM output for a confirmed story event.

A long-running serial's interesting dimensions are **open vocabulary** and
**temporal**. Ask not merely "is this a regression novel?", but:

- Who originally misunderstood whom, for what stated reason, and when did that change?
- What training or resources caused a measurable progression? Did its unit/realm/rank change?
- Who witnessed the protagonist's feat, how did they react, and did the knowledge spread?
- What was the protagonist's identity before and after disclosure? Who learned the truth?
- Which factions know about an event, what decisions followed, and how long did recognition last?
- What romantic, political, family, clan, mentor, or rivalry relationships actually changed?
- Were setbacks and payoffs earned by prior decisions, or presented as one-off reversals?
- What is explicitly stated by the narrator, inferred from context, contested, or simply unknown?
- Are there contradictions between chapters, narrator reliability, or later retcons?

## Three separate levels: never conflate them

1. **Source-observed** — source paragraph/section position and text fingerprint.
2. **Model-candidate** — locally generated, constrained JSON event proposals (NOT trusted).
3. **Reviewed** — a separate editor checks whether the passage entails each factual assertion,
   actor, timeline, witness, causality, and before/after state. Human review cannot be claimed
   merely from automatic anchor matching or this assistant's initial sample.

All fact atoms preserve source edition, chapter index, paragraph index, spoiler tier,
open-vocabulary topic terms and review status. No full source paragraphs are exposed
to public search APIs.

## Implemented

- Reviewed-rights public-domain novel text assets are the only inputs to the current
  processing pipeline. The 43 external webnovel directory records are NEVER used
  as chapter sources; their novels remain copyrighted.
- 13 initial editorial sample events across *Dracula*, *Frankenstein*, and
  *Pride and Prejudice*, each with a real paragraph anchor. This tiny sample is
  explicitly NOT exhaustive AI analysis or human verification.
- Build-time gate checks the original edition's rights decision, exact chapter
  and paragraph anchor, and status. Revocation or source changes break the build
  rather than leaking stale information.
- Private source-anchored event index under server/private; small, safe public
  coverage counts; chapter events are not exported to dist.
- /api/narrative: book-title-only matches by default; an intentional
  reveal flag PLUS exact book and chapter cutoff is required to receive
  brief, chapter-bounded editorial samples. No raw chapter text.
- /#assistant: reader-facing source-event search with spoiler settings,
  separate from weaker lexical search and the external directory.
- Optional local Ollama model proposer:
  python3 scripts/local_story_intelligence.py --book dracula --first 1 --last 3 --max-packets 30
  This creates **private packets and zero model calls** by default.
  To attempt local-only candidate generation:
  python3 scripts/local_story_intelligence.py --book dracula --first 1 --last 3 --max-packets 15 --local-model llama3.2
  This contacts ONLY http://127.0.0.1:11434/api/generate and saves proposals
  privately. It requires a running installed Ollama model. Zero ChatGPT/Gemini/API
  inference billing. Candidates are never auto-published and must be reviewed.

## For other novels

**DO NOT** automate scraping every chapter on Webnovel, Wuxiaworld, or Royal
Road. Those novel texts and translations belong to authors, publishers and/or
platform licensees. Wuxiaworld explicitly disallows unapproved bots, mass
extraction and AI/ML model uses. Webnovel grants a narrow personal-use licence,
not a blanket third-party processing right. Australia has not established
an unrestricted TDM exception.

Use direct author permission or publisher licences specifying:
- permitted edition/language/territory;
- whether full text may be processed locally by a model, with or without retention;
- what factual event labels and spoiler-derived results may be published;
- permission revocation, takedown/delete workflows, and whether model training
  (which is NOT needed for this pipeline) is prohibited;
- API/feed/access authorisation, rate limits and commercial use.

Start with opt-in Royal Road authors willing to submit their own
manuscript directly and receive analytical feedback and deeper discovery.
Do not assume an author can license third-party translations or signed exclusives.

## Falsifiable measurement

Track precision and recall on reviewed event questions, subject/object alignment,
false witness attribution, chronology errors, spoiler leaks and negative queries.
A pilot with 13 events and three classics is a **working architecture test**,
not proof of a comprehensive "every-novel" semantic engine.

References:
- https://www.wuxiaworld.com/terms-of-service
- https://www.webnovel.com/terms_of_service
- https://www.ag.gov.au/rights-and-protections/copyright/copyright-and-artificial-intelligence-reference-group-cairg
