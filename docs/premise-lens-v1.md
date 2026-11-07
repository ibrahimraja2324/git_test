# Reader-selected story promises: truthful cold-start matching

## What changed
The old #taste feature used only genre similarity from readers' star ratings.
A new, separate first-party discovery brief stores what a reader explicitly
wants next and matches to *documented original Novalume summary phrases*.

This release adds 26 hand-reviewed premise hint mappings covering
23 of 66 source-linked novels. A mapping is
not a claim that an arc actually delivered the payoff. The UI shows the precise
source phrase and the original-series source record. Unmapped dimensions
produce uncertainty, NOT false negatives or invented recommendations.
All snippets are from Novalume-authored summaries, not copyrighted chapters.

The user's brief and past experience live only in browser-local storage.
No new tracking, automated sharing, paid AI, or fake reader activity.

## Falsifiable test
Hypothesis: readers who select a specific narrative experience and receive
explicitly evidenced premise candidates will find a relevant starting point
more often than genre-only navigation. Strongest alternative: source summaries
are too thin to cover the specific experiences the audience values, making
this new index inferior to ordinary genre suggestions.

Current evidence: 0 actual participant outcomes. Tests validate provenance,
unsupported-trait abstention, XSS escaping, and deterministic matching,
NOT customer preference or novel-content truth. No A/B lift claim.

Stop condition: do not broaden the editorial index until real reader feedback
indicates that these promise labels help. Build an explicit user-contributed
evidence pipeline with revocable consent, and evaluate 20+ genuine completed
discovery attempts against the existing genre baseline. Do not recruit by
secret tracking or falsify that sample threshold.

## Future
A defensible data asset would contain experience expectation -> actual
outcome at a chapter -> user's subsequent reading decision. Verified
author/reader reports or rights-cleared primary text must support eventual
plot-level truth. The current 26 editorial hints are reproducible and are
not a moat by themselves.
