# Reader-derived narrative understanding (first evidence slice)

Problem: 66 verified external works and 3,528 provisional title leads are
reproducible public knowledge. Even 100,000 tags would not create a durable
customer-understanding moat. As of 8 November, Novalume has zero real
profiles, reviews and cloud diaries. There is no proprietary historical
learning corpus yet. Do not invent one.

## Differentiated unit of data

A self-reported reader experience is an ordered record:
reader (owner) x canonical original work x what they sought (wanted) x
whether it delivered/missed each quality x reading outcome x chapter cutoff
x optional private concrete note.

Example narrative dimensions include measurable growth, earned power,
public reputation, witness reactions, social reversal, meaningful relationship
tension, long-term payoff, causal world consequence and pacing. These are
signals of what *one reader thought*, not proof that these tropes are present
in a work or a licence to analyse its unapproved text.

## Data provenance and permissions

Captured in \`src/reader_experience.js\` directly on a verified work.
Saved to browser by default, NOT silently sent to any service. Clear and
export controls. Account backup requires an explicit button and auth; schema
\`public.novalume_reader_experience\` has strict owner-only RLS, no
aggregate SELECT, no public review inference, no analytics event pipeline.
Future pooled, anonymous product research needs separate transparent consent
and privacy controls. Do not promise a universal moat before users contribute.

## Measurement design

Measure only after real people use it:
- eligible real readers who recorded a wanted dimension and an outcome;
- share of source-linked works with 3+ independently contributed experiences
  (only with appropriate aggregation consent);
- explicit "missed expectation" and reader-stop reasons, segmented by source
  and chapter, with sample size and user-reported uncertainty;
- offline replay: does a data-informed recommendation outperform genre-only
  ranking on held-out actual reader selections? Guard against selection bias,
  self-report errors, sparse titles, brigading and duplicate accounts.
The current baseline is **zero participants** and no proven improvement.

Prioritize organic value: users should be able to remember why a story
worked and avoid disappointment, not fill out a survey for the operator.
Never infer sensitive reader traits, copy full third-party chapters or
pretend independent self-reports are authoritative plot events.
