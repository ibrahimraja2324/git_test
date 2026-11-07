-- User suggestions stay private to their submitter until explicitly reviewed.
-- Never give anonymous users or authenticated clients a way to mark a title approved.
create table if not exists public.novalume_title_suggestions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(trim(title)) between 2 and 180),
 author text not null check (length(trim(author)) between 2 and 120),
 original_language text not null check (original_language in ('Chinese','Korean','English')),
 source_url text not null check (
  length(source_url) <= 320
  and source_url ~ '^https://(fanqienovel\.com/page/[0-9]{15,20}|www\.tadu\.com/book/[0-9]{3,12}|www\.wuxiaworld\.com/novel/[a-z0-9-]+|www\.royalroad\.com/fiction/[0-9]{1,15}/[a-z0-9-]+|www\.novelupdates\.com/series/[a-z0-9-]+/|www\.webnovel\.com/book/[0-9]+|www\.scribblehub\.com/series/[0-9]+/[a-z0-9-]+/?)$'
 ),
 notes text not null default '' check (length(notes)<=500),
 review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
 reviewer_id uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 unique (user_id,source_url)
);
create index if not exists novalume_suggestion_review_idx
 on public.novalume_title_suggestions(review_status,created_at desc);
create index if not exists novalume_suggestion_owner_idx
 on public.novalume_title_suggestions(user_id,created_at desc);
alter table public.novalume_title_suggestions enable row level security;
revoke all on public.novalume_title_suggestions from public,anon,authenticated;
grant select on public.novalume_title_suggestions to authenticated;
grant insert (user_id,title,author,original_language,source_url,notes)
 on public.novalume_title_suggestions to authenticated;
grant delete on public.novalume_title_suggestions to authenticated;
create policy nov_suggest_read_own on public.novalume_title_suggestions
 for select to authenticated using (user_id=(select auth.uid()));
create policy nov_suggest_submit_own on public.novalume_title_suggestions
 for insert to authenticated with check
 (user_id=(select auth.uid()) and review_status='pending' and reviewer_id is null
  and reviewed_at is null and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_suggest_delete_pending_own on public.novalume_title_suggestions
 for delete to authenticated using
 (user_id=(select auth.uid()) and review_status='pending');
-- No UPDATE grant or policy for authenticated/anon; review triage is service/admin only.
