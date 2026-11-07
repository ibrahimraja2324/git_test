# Novalume real community: implementation, safety and launch gates

The user-owned Supabase general project nsjczdmkifzxhiihfcrr now hosts seven isolated Novalume tables. The authoritative source schema is db/novalume_social_v1.sql, and 56 genuine source-linked webnovel records are now seeded into the works table. All seven tables have RLS enabled.

Current counts following the 8 November update: 56 works, 0 reader profiles, 0 public reviews, 0 user-submitted novel suggestions, 0 private diary rows. This is not a fabricated populated community. No unrelated application tables were changed.

The client implementation is in src/community.js, backed by a browser-safe anon/public API key (NOT a privileged service role). The site has a Community route for email/password sign-in, handles, reader profiles, follows, public user-written reviews, a spoiler warning, review reports, and deletion of one's own published reviews. All public publishing is an explicit user action. The private diary remains on the reader's device until they explicitly request a cloud backup or restore. Cloud diary deletion is also supported.

Verified database permissions: anonymous visitors cannot SELECT private diary rows or INSERT public reviews; all private diary SQL policies require the authenticated user's own ID. Public review text is escaped before HTML display. GitHub source/logic tests passed.

Not yet verified end-to-end: actual signup/email confirmation/redirect, full browser/mobile UX, a successful first public post, two-user follows, active report moderation, abuse-rate limiting and full Auth account deletion. Code presence and production deployment do not establish those tests passed.

Mandatory Supabase Dashboard step: Project nsjczdmkifzxhiihfcrr -> Authentication -> URL Configuration. ADD https://novalume-story-search.vercel.app/** as an Additional Redirect URL. DO NOT overwrite the existing Site URL because this authentication project is shared with unrelated apps. The Novalume client explicitly requests the origin + pathname when signing up; inspect the confirmation email template's RedirectTo/ConfirmationURL behaviour if it still points to another app. The installed Supabase connector cannot edit this setting. Check email verification and delivery quotas. Do not disable confirmations to work around redirect mistakes.

The backend shares a general Supabase project's authentication realm with other unrelated user projects, while Novalume tables and RLS are isolated. A dedicated Novalume project may be preferable for a larger launch but should not be created at an unapproved nonzero cost.

Privacy: public handles, optional display names, published reviews and follows are public; emails, chapter progress, private reviews and notes are not. Deleting a public review or a diary cloud backup does NOT delete the account. An account deletion process remains a launch blocker.

Relevant docs: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/auth/redirect-urls.

## Community missing-novel contributions (8 Nov 2026)

The public community UI includes a form to submit an original title, author,
language, exact legitimate work URL and optional short source note. It is only
available after sign-in and setting a public handle. Suggestions are NOT made
public without editorial approval. Readers can see their own queue and
withdraw pending suggestions.

Migration: db/novalume_suggestions_v1.sql. Security: seven Novalume tables
have RLS; novalume_title_suggestions SELECT is owner-only, anonymous
read/write is denied, and authenticated clients have INSERT privilege only
for six factual user-submission fields, NOT review_status, reviewer_id or
reviewed_at. No authenticated UPDATE policy is granted. SQL provider URL
patterns exclude search pages, chapters and arbitrary external sites.

Staff review can use an authorised Supabase administrative workflow, but
there is no self-serve public moderation dashboard. Never claim successful
email signup without an end-to-end test; add only the Additional Redirect
URL in the shared Auth project without changing Site URL.
