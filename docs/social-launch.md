# Novalume real community: implementation, safety and launch gates

The actual user-owned Supabase general project nsjczdmkifzxhiihfcrr now hosts six new, isolated Novalume tables. The authoritative source schema is db/novalume_social_v1.sql, and 54 genuine previously reviewed webnovel records are seeded into the works table. The six tables are all RLS-protected.

Current counts immediately after setup: 54 works, 0 reader profiles, 0 public reviews, 0 private diary rows. This is not a fabricated populated community. No unrelated application tables were changed.

The client implementation is in src/community.js, backed by a browser-safe anon/public API key (NOT a privileged service role). The site has a Community route for email/password sign-in, handles, reader profiles, follows, public user-written reviews, a spoiler warning, review reports, and deletion of one's own published reviews. All public publishing is an explicit user action. The private diary remains on the reader's device until they explicitly request a cloud backup or restore. Cloud diary deletion is also supported.

Verified database permissions: anonymous visitors cannot SELECT private diary rows or INSERT public reviews; all private diary SQL policies require the authenticated user's own ID. Public review text is escaped before HTML display. GitHub source/logic tests passed.

Not yet verified end-to-end: actual signup/email confirmation/redirect, full browser/mobile UX, a successful first public post, two-user follows, active report moderation, abuse-rate limiting and full Auth account deletion. Code presence and production deployment do not establish those tests passed.

Mandatory Supabase Dashboard step: Project nsjczdmkifzxhiihfcrr -> Authentication -> URL Configuration. Set Site URL to https://novalume-story-search.vercel.app and add the production URL to the Redirect URLs allowlist. The installed Supabase connector currently cannot change that setting. Check email verification and delivery quotas there too. Do not disable email confirmation as a shortcut.

The backend shares a general Supabase project's authentication realm with other unrelated user projects, while Novalume tables and RLS are isolated. A dedicated Novalume project may be preferable for a larger launch but should not be created at an unapproved nonzero cost.

Privacy: public handles, optional display names, published reviews and follows are public; emails, chapter progress, private reviews and notes are not. Deleting a public review or a diary cloud backup does NOT delete the account. An account deletion process remains a launch blocker.

Relevant docs: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/auth/redirect-urls.
