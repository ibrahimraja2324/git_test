-- Explicit, revocable reader-contributed experience labels.
-- Owners can see/edit/delete ONLY their own rows. No public or pooled reads.
-- This table does not contain private notes, reviews, chapter numbers or profiles.
create table if not exists public.novalume_consented_outcomes (
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id text not null references public.novalume_works(id) on delete cascade,
  wanted jsonb not null,
  delivered jsonb not null,
  missing jsonb not null,
  reading_outcome text not null check(reading_outcome in ('unspecified','reading','completed','stopped')),
  chapter_band text not null check(chapter_band in ('unknown','1-19','20-99','100-499','500+')),
  consent_version text not null check(consent_version='novalume-research-v1-2026-11'),
  consented_at timestamptz not null,
  primary key(user_id,work_id),
  constraint nov_consented_wanted_array check(jsonb_typeof(wanted)='array' and jsonb_array_length(wanted)<=10),
  constraint nov_consented_delivered_array check(jsonb_typeof(delivered)='array' and jsonb_array_length(delivered)<=10),
  constraint nov_consented_missing_array check(jsonb_typeof(missing)='array' and jsonb_array_length(missing)<=10),
  constraint nov_consented_wanted_codes check(
    wanted <@ '["public_recognition","visible_reactions","measurable_growth","earned_power","long_term_payoff","smart_protagonist","social_reversal","relationship_tension","fast_pacing","world_consequence"]'::jsonb
  ),
  constraint nov_consented_delivered_codes check(
    delivered <@ '["public_recognition","visible_reactions","measurable_growth","earned_power","long_term_payoff","smart_protagonist","social_reversal","relationship_tension","fast_pacing","world_consequence"]'::jsonb
  ),
  constraint nov_consented_missing_codes check(
    missing <@ '["public_recognition","visible_reactions","measurable_growth","earned_power","long_term_payoff","smart_protagonist","social_reversal","relationship_tension","fast_pacing","world_consequence"]'::jsonb
  ),
  constraint nov_consented_only_judged_wants check(
    jsonb_array_length(wanted)>0 AND
    jsonb_array_length(delivered)+jsonb_array_length(missing)>0 AND
    delivered <@ wanted AND missing <@ wanted
  )
);
alter table public.novalume_consented_outcomes enable row level security;
revoke all on public.novalume_consented_outcomes from PUBLIC,anon,authenticated;
grant select,insert,update,delete on public.novalume_consented_outcomes to authenticated;
create policy nov_consent_owner_select on public.novalume_consented_outcomes
  for select to authenticated using (user_id=(select auth.uid()));
create policy nov_consent_owner_insert on public.novalume_consented_outcomes
  for insert to authenticated with check(
    user_id=(select auth.uid()) and
    (select auth.jwt()->>'is_anonymous') is distinct from 'true'
  );
create policy nov_consent_owner_update on public.novalume_consented_outcomes
  for update to authenticated using(user_id=(select auth.uid()))
  with check(user_id=(select auth.uid()) and
   (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_consent_owner_delete on public.novalume_consented_outcomes
  for delete to authenticated using(user_id=(select auth.uid()));
-- No public aggregate/view/RPC. Aggregation is a separate reviewed, privacy-safe release gate.
