-- ============================================================================
-- NPL Fan Zone - schema
-- Run this first in the Supabase SQL Editor (or `supabase db push`).
-- Requires a Supabase project (auth.users exists).
-- ============================================================================

-- gen_random_uuid() is built into PostgreSQL 13+ (no extension needed).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Teams / players
-- ---------------------------------------------------------------------------

create table if not exists public.teams (
  id text primary key,
  name text not null unique,
  short_name text,
  abbreviation text not null,
  city text,
  province text,
  primary_color text,
  accent_color text,
  description text,
  captain text,
  head_coach text,
  previous_finish text,
  image_url text,
  source_label text,
  source_url text,
  last_verified date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  name text not null,
  role text check (role in ('batter', 'bowler', 'all-rounder', 'wicketkeeper')),
  nationality text,
  is_captain boolean not null default false,
  jersey_number integer check (jersey_number between 0 and 99),
  image_url text,
  bio text,
  verified boolean not null default false,
  source_label text,
  source_url text,
  last_verified date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_team_idx on public.players (team_id);
create index if not exists players_name_idx on public.players (lower(name));

-- ---------------------------------------------------------------------------
-- Matches, innings and scorecards
-- ---------------------------------------------------------------------------

create table if not exists public.matches (
  id text primary key,
  tournament_id text not null default 'npl-2026',
  match_no integer not null,
  stage text not null default 'league'
    check (stage in ('league', 'qualifier1', 'eliminator', 'qualifier2', 'final')),
  home_team_id text references public.teams(id) on delete set null,
  away_team_id text references public.teams(id) on delete set null,
  home_label text,
  away_label text,
  start_time timestamptz not null,
  venue text not null default 'Tribhuvan University International Cricket Ground, Kirtipur, Nepal',
  status text not null default 'upcoming'
    check (status in ('upcoming', 'live', 'completed', 'postponed', 'abandoned')),
  status_note text,
  toss_winner_team_id text references public.teams(id) on delete set null,
  toss_decision text check (toss_decision in ('bat', 'bowl')),
  result_type text check (result_type in ('win', 'tie', 'no-result')),
  winner_team_id text references public.teams(id) on delete set null,
  result_margin text,
  result_summary text,
  player_of_match_id text references public.players(id) on delete set null,
  summary text,
  source_label text,
  source_url text,
  verified_schedule boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_no)
);

create index if not exists matches_start_idx on public.matches (start_time);
create index if not exists matches_stage_idx on public.matches (stage, status);
create index if not exists matches_home_idx on public.matches (home_team_id);
create index if not exists matches_away_idx on public.matches (away_team_id);

create table if not exists public.match_innings (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  runs integer not null default 0 check (runs >= 0),
  wickets integer not null default 0 check (wickets between 0 and 10),
  overs numeric(4,1) not null default 0 check (overs >= 0 and overs <= 50),
  innings_no integer not null default 1 check (innings_no between 1 and 2),
  created_at timestamptz not null default now(),
  unique (match_id, team_id),
  unique (match_id, innings_no)
);

create index if not exists innings_match_idx on public.match_innings (match_id);

create table if not exists public.batting_scorecards (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  runs integer not null default 0 check (runs >= 0),
  balls integer not null default 0 check (balls >= 0),
  fours integer not null default 0 check (fours >= 0),
  sixes integer not null default 0 check (sixes >= 0),
  out boolean not null default true,
  dismissal text,
  created_at timestamptz not null default now()
);

create table if not exists public.bowling_scorecards (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  overs numeric(4,1) not null default 0 check (overs >= 0 and overs <= 50),
  maidens integer not null default 0 check (maidens >= 0),
  runs_conceded integer not null default 0 check (runs_conceded >= 0),
  wickets integer not null default 0 check (wickets between 0 and 10),
  created_at timestamptz not null default now()
);

create table if not exists public.fielding_scorecards (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  catches integer not null default 0 check (catches >= 0),
  stumpings integer not null default 0 check (stumpings >= 0),
  run_outs integer not null default 0 check (run_outs >= 0),
  created_at timestamptz not null default now()
);

create index if not exists batting_match_idx on public.batting_scorecards (match_id);
create index if not exists batting_player_idx on public.batting_scorecards (player_id);
create index if not exists bowling_match_idx on public.bowling_scorecards (match_id);
create index if not exists bowling_player_idx on public.bowling_scorecards (player_id);
create index if not exists fielding_match_idx on public.fielding_scorecards (match_id);

-- ---------------------------------------------------------------------------
-- Editorial
-- ---------------------------------------------------------------------------

create table if not exists public.articles (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  category text not null default 'Explainer',
  author text not null,
  content jsonb not null default '[]'::jsonb,
  cover_image_url text,
  related_team_id text references public.teams(id) on delete set null,
  related_player_id text references public.players(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_sample boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_idx on public.articles (status, published_at desc);

-- ---------------------------------------------------------------------------
-- Polls
-- ---------------------------------------------------------------------------

create table if not exists public.polls (
  id text primary key,
  question text not null,
  description text,
  poll_type text not null default 'general',
  closes_at timestamptz,
  is_active boolean not null default true,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id text primary key,
  poll_id text not null references public.polls(id) on delete cascade,
  label text not null,
  team_id text references public.teams(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists poll_options_poll_idx on public.poll_options (poll_id);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references public.polls(id) on delete cascade,
  option_id text not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index if not exists poll_votes_poll_idx on public.poll_votes (poll_id, option_id);

-- ---------------------------------------------------------------------------
-- Users, roles, favourites
-- ---------------------------------------------------------------------------

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Fan',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table if not exists public.favorite_teams (
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, team_id)
);

create table if not exists public.favorite_players (
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, player_id)
);

create table if not exists public.saved_matches (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create table if not exists public.match_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  predicted_winner_team_id text not null references public.teams(id) on delete cascade,
  predicted_first_innings_score integer check (
    predicted_first_innings_score between 0 and 400
  ),
  display_name text not null default 'Fan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists predictions_match_idx on public.match_predictions (match_id);
create index if not exists predictions_user_idx on public.match_predictions (user_id);

create table if not exists public.tournament_rules (
  tournament_id text primary key,
  win integer not null default 2 check (win >= 0),
  tie integer not null default 1 check (tie >= 0),
  no_result integer not null default 1 check (no_result >= 0),
  loss integer not null default 0 check (loss >= 0),
  all_out_uses_full_quota boolean not null default true,
  overs_per_innings integer not null default 20 check (overs_per_innings between 1 and 50),
  tie_breakers text[] not null default array['nrr', 'wins', 'headToHead', 'name'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  action text not null,
  entity text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists activity_created_idx on public.admin_activity_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists teams_updated_at on public.teams;
create trigger teams_updated_at before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists players_updated_at on public.players;
create trigger players_updated_at before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.user_profiles;
create trigger profiles_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists predictions_updated_at on public.match_predictions;
create trigger predictions_updated_at before update on public.match_predictions
for each row execute function public.set_updated_at();

drop trigger if exists rules_updated_at on public.tournament_rules;
create trigger rules_updated_at before update on public.tournament_rules
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile creation on sign-up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Fan')
  )
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Admin check (used by RLS policies)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aggregate RPCs (no identities leaked)
-- ---------------------------------------------------------------------------

create or replace function public.poll_results()
returns table (poll_id text, option_id text, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.poll_id, v.option_id, count(*)::bigint
  from public.poll_votes v
  group by v.poll_id, v.option_id;
$$;

revoke all on function public.poll_results() from public;
grant execute on function public.poll_results() to anon, authenticated;

create or replace function public.match_prediction_summary()
returns table (match_id text, team_id text, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.match_id, p.predicted_winner_team_id, count(*)::bigint
  from public.match_predictions p
  group by p.match_id, p.predicted_winner_team_id;
$$;

revoke all on function public.match_prediction_summary() from public;
grant execute on function public.match_prediction_summary() to anon, authenticated;

create or replace function public.prediction_leaderboard()
returns table (
  user_id uuid,
  display_name text,
  points bigint,
  settled bigint,
  correct_winners bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with settled as (
    select
      p.user_id,
      p.display_name,
      p.predicted_winner_team_id,
      p.predicted_first_innings_score,
      m.winner_team_id,
      (
        select i.runs from public.match_innings i
        where i.match_id = m.id
        order by i.innings_no asc
        limit 1
      ) as first_innings_runs
    from public.match_predictions p
    join public.matches m on m.id = p.match_id
    where m.status = 'completed'
  ),
  scored as (
    select
      s.user_id,
      s.display_name,
      (case when s.predicted_winner_team_id = s.winner_team_id then 10 else 0 end)
      + (case
          when s.predicted_first_innings_score is not null and s.first_innings_runs is not null then
            case
              when abs(s.predicted_first_innings_score - s.first_innings_runs) <= 10 then 5
              when abs(s.predicted_first_innings_score - s.first_innings_runs) <= 20 then 3
              else 0
            end
          else 0
        end) as points,
      (s.predicted_winner_team_id = s.winner_team_id) as correct
    from settled s
  )
  select
    scored.user_id,
    max(scored.display_name) as display_name,
    sum(scored.points)::bigint as points,
    count(*)::bigint as settled,
    (count(*) filter (where scored.correct))::bigint as correct_winners
  from scored
  group by scored.user_id
  order by points desc, correct_winners desc, display_name asc
  limit 100;
$$;

revoke all on function public.prediction_leaderboard() from public;
grant execute on function public.prediction_leaderboard() to anon, authenticated;
