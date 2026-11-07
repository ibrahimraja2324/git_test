# Novalume — launch gates and acquisition work

Public real-work catalogue: 54 verified/link-record entries, not 7,476 or 24,639.
Social backend: six RLS tables created in user-owned Supabase generic project, 54 seeded works, zero initial public reviews/profiles.
Community frontend supports auth, public reader handles, reviews, follows, reporting and explicit diary cloud backups; actual signup/email QA unverified.

NV-056: In Supabase Authentication > URL Configuration for shared project nsjczdmkifzxhiihfcrr, add https://novalume-story-search.vercel.app/** to Additional Redirect URLs WITHOUT changing its existing Site URL (other projects use the same Auth instance). Verify email confirmation template redirects, then real signup, public reviews, follows, cloud restore, moderation and account deletion. Installed plugin cannot change redirect settings.

NV-050 / NV-057: Obtain the actual CC0-claimed 7,476-title Chinese release, run scripts/import_cc0_webnovel_candidates.py to produce review-only identities. No public promotion until verified author, original work and legitimate source link. Avoid copying upstream descriptions/ratings and data with unclear rights.

NV-054: build real collaborative taste (once real reviews arrive), review moderation, report administration and account deletion. Zero fake user activity.

See docs/social-launch.md and docs/title-acquisition.md.