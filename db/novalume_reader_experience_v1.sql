-- Private, explicitly user-submitted desire -> experienced outcome.
-- Do NOT expose anyone's private evidence as public book facts or community ratings.
create table if not exists public.novalume_reader_experience (
 user_id uuid not null references auth.users(id) on delete cascade,
 work_id text not null references public.novalume_works(id) on delete cascade,
 reading_outcome text not null default 'unspecified'
  check (reading_outcome in ('unspecified','reading','completed','stopped')),
 wanted jsonb not null default '[]'::jsonb,
 delivered jsonb not null default '[]'::jsonb,
 missing jsonb not null default '[]'::jsonb,
 chapter integer not null default 0 check (chapter between 0 and 1000000),
 private_note text not null default '' check (length(private_note)<=280),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key (user_id,work_id),
 check (jsonb_typeof(wanted)='array' and jsonb_array_length(wanted)<=10),
 check (jsonb_typeof(delivered)='array' and jsonb_array_length(delivered)<=10),
 check (jsonb_typeof(missing)='array' and jsonb_array_length(missing)<=10)
);
alter table public.novalume_reader_experience enable row level security;
revoke all on public.novalume_reader_experience from PUBLIC,anon,authenticated;
grant select,insert,update,delete on public.novalume_reader_experience to authenticated;
create policy nov_exp_private_select on public.novalume_reader_experience
 for select to authenticated using (user_id=(select auth.uid()));
create policy nov_exp_private_insert on public.novalume_reader_experience
 for insert to authenticated with check (
  user_id=(select auth.uid()) and
  (select auth.jwt()->>'is_anonymous') is distinct from 'true'
 );
create policy nov_exp_private_update on public.novalume_reader_experience
 for update to authenticated using (user_id=(select auth.uid()))
 with check (user_id=(select auth.uid())
  and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_exp_private_delete on public.novalume_reader_experience
 for delete to authenticated using (user_id=(select auth.uid()));
-- No policies for public/anon. No aggregation, analytics consent, or
-- privileged views; only the owner can read this personal record.
