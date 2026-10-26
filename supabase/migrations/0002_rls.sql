-- ============================================================================
-- NPL Fan Zone - Row Level Security
-- Run after 0001_schema.sql and before 0003_seed.sql.
--
-- Principle: the public can read tournament content; only accounts with the
-- 'admin' role in public.user_roles can change it. Users can always read and
-- write only their own profile, favourites and predictions.
-- ============================================================================

-- Supabase normally grants these automatically; making them explicit keeps the
-- migration portable and lets non-owner roles reach the RLS policies.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to anon, authenticated;

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_innings enable row level security;
alter table public.batting_scorecards enable row level security;
alter table public.bowling_scorecards enable row level security;
alter table public.fielding_scorecards enable row level security;
alter table public.articles enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.favorite_teams enable row level security;
alter table public.favorite_players enable row level security;
alter table public.saved_matches enable row level security;
alter table public.match_predictions enable row level security;
alter table public.tournament_rules enable row level security;
alter table public.admin_activity_log enable row level security;

-- ---------------------------------------------------------------------------
-- Public tournament content: read for everyone, write for admins
-- ---------------------------------------------------------------------------

drop policy if exists "teams_public_read" on public.teams;
create policy "teams_public_read" on public.teams
for select using (true);
drop policy if exists "teams_admin_write" on public.teams;
create policy "teams_admin_write" on public.teams
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "players_public_read" on public.players;
create policy "players_public_read" on public.players
for select using (true);
drop policy if exists "players_admin_write" on public.players;
create policy "players_admin_write" on public.players
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "matches_public_read" on public.matches;
create policy "matches_public_read" on public.matches
for select using (true);
drop policy if exists "matches_admin_write" on public.matches;
create policy "matches_admin_write" on public.matches
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "innings_public_read" on public.match_innings;
create policy "innings_public_read" on public.match_innings
for select using (true);
drop policy if exists "innings_admin_write" on public.match_innings;
create policy "innings_admin_write" on public.match_innings
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "batting_public_read" on public.batting_scorecards;
create policy "batting_public_read" on public.batting_scorecards
for select using (true);
drop policy if exists "batting_admin_write" on public.batting_scorecards;
create policy "batting_admin_write" on public.batting_scorecards
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "bowling_public_read" on public.bowling_scorecards;
create policy "bowling_public_read" on public.bowling_scorecards
for select using (true);
drop policy if exists "bowling_admin_write" on public.bowling_scorecards;
create policy "bowling_admin_write" on public.bowling_scorecards
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "fielding_public_read" on public.fielding_scorecards;
create policy "fielding_public_read" on public.fielding_scorecards
for select using (true);
drop policy if exists "fielding_admin_write" on public.fielding_scorecards;
create policy "fielding_admin_write" on public.fielding_scorecards
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read" on public.articles
for select using (status = 'published' or public.is_admin());
drop policy if exists "articles_admin_write" on public.articles;
create policy "articles_admin_write" on public.articles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "polls_public_read" on public.polls;
create policy "polls_public_read" on public.polls
for select using (true);
drop policy if exists "polls_admin_write" on public.polls;
create policy "polls_admin_write" on public.polls
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "poll_options_public_read" on public.poll_options;
create policy "poll_options_public_read" on public.poll_options
for select using (true);
drop policy if exists "poll_options_admin_write" on public.poll_options;
create policy "poll_options_admin_write" on public.poll_options
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "rules_public_read" on public.tournament_rules;
create policy "rules_public_read" on public.tournament_rules
for select using (true);
drop policy if exists "rules_admin_write" on public.tournament_rules;
create policy "rules_admin_write" on public.tournament_rules
for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Poll votes: own row only; database enforces one vote and an open poll
-- ---------------------------------------------------------------------------

drop policy if exists "poll_votes_read_own" on public.poll_votes;
create policy "poll_votes_read_own" on public.poll_votes
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "poll_votes_insert_own" on public.poll_votes;
create policy "poll_votes_insert_own" on public.poll_votes
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.polls p
    join public.poll_options o on o.poll_id = p.id
    where p.id = poll_votes.poll_id
      and o.id = poll_votes.option_id
      and p.is_active = true
      and (p.closes_at is null or p.closes_at > now())
  )
);

drop policy if exists "poll_votes_update_own" on public.poll_votes;
create policy "poll_votes_update_own" on public.poll_votes
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.polls p
    join public.poll_options o on o.poll_id = p.id
    where p.id = poll_votes.poll_id
      and o.id = poll_votes.option_id
      and p.is_active = true
      and (p.closes_at is null or p.closes_at > now())
  )
);

drop policy if exists "poll_votes_admin_delete" on public.poll_votes;
create policy "poll_votes_admin_delete" on public.poll_votes
for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_read_own" on public.user_profiles;
create policy "profiles_read_own" on public.user_profiles
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.user_profiles;
create policy "profiles_insert_own" on public.user_profiles
for insert with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own" on public.user_profiles
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A user may read only their own role. Nobody can grant roles from the browser;
-- promote the first admin with SQL (see README) or the service role.
drop policy if exists "roles_read_own" on public.user_roles;
create policy "roles_read_own" on public.user_roles
for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Favourites and saved matches: strictly owner-only
-- ---------------------------------------------------------------------------

drop policy if exists "favorite_teams_own" on public.favorite_teams;
create policy "favorite_teams_own" on public.favorite_teams
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "favorite_players_own" on public.favorite_players;
create policy "favorite_players_own" on public.favorite_players
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "saved_matches_own" on public.saved_matches;
create policy "saved_matches_own" on public.saved_matches
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Predictions: owner-only, locked at the scheduled start time
-- ---------------------------------------------------------------------------

drop policy if exists "predictions_read_own" on public.match_predictions;
create policy "predictions_read_own" on public.match_predictions
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "predictions_insert_own" on public.match_predictions;
create policy "predictions_insert_own" on public.match_predictions
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.matches m
    where m.id = match_predictions.match_id
      and m.status = 'upcoming'
      and m.start_time > now()
      and match_predictions.predicted_winner_team_id in (m.home_team_id, m.away_team_id)
  )
);

drop policy if exists "predictions_update_own" on public.match_predictions;
create policy "predictions_update_own" on public.match_predictions
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.matches m
    where m.id = match_predictions.match_id
      and m.status = 'upcoming'
      and m.start_time > now()
      and match_predictions.predicted_winner_team_id in (m.home_team_id, m.away_team_id)
  )
);

drop policy if exists "predictions_delete_own" on public.match_predictions;
create policy "predictions_delete_own" on public.match_predictions
for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Admin activity log
-- ---------------------------------------------------------------------------

drop policy if exists "activity_admin_read" on public.admin_activity_log;
create policy "activity_admin_read" on public.admin_activity_log
for select using (public.is_admin());

drop policy if exists "activity_admin_insert" on public.admin_activity_log;
create policy "activity_admin_insert" on public.admin_activity_log
for insert with check (public.is_admin() and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: public read, admin write
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('npl-media', 'npl-media', true)
on conflict (id) do nothing;

drop policy if exists "npl_media_public_read" on storage.objects;
create policy "npl_media_public_read" on storage.objects
for select using (bucket_id = 'npl-media');

drop policy if exists "npl_media_admin_insert" on storage.objects;
create policy "npl_media_admin_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'npl-media' and public.is_admin());

drop policy if exists "npl_media_admin_update" on storage.objects;
create policy "npl_media_admin_update" on storage.objects
for update to authenticated
using (bucket_id = 'npl-media' and public.is_admin())
with check (bucket_id = 'npl-media' and public.is_admin());

drop policy if exists "npl_media_admin_delete" on storage.objects;
create policy "npl_media_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'npl-media' and public.is_admin());
