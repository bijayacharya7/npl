/** Apply the Supabase schema to local PostgreSQL-in-WASM and check RLS/data integrity. */
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const db = new PGlite()
let failures = 0
const check = (label, ok) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) failures += 1
}
const one = async (sql, params = []) => (await db.query(sql, params)).rows[0]

try {
  await db.exec(`
    create schema auth;
    create schema storage;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text unique,
      raw_user_meta_data jsonb default '{}'::jsonb
    );
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
    end $$;
    create table storage.buckets (id text primary key, name text, public boolean default false);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  `)

  for (const migration of [
    '../supabase/migrations/0001_schema.sql',
    '../supabase/migrations/0002_rls.sql',
    '../supabase/migrations/0003_cricketdata_cache.sql',
    '../supabase/migrations/0004_retire_fan_features.sql',
  ]) {
    await db.exec(read(migration))
    console.log(`Applied ${migration.split('/').at(-1)}`)
  }
  await db.exec(read('../supabase/seed.sql'))

  console.log('\nSeed and retired features:')
  check('8 teams seeded', (await one('select count(*)::int n from public.teams')).n === 8)
  check('137 players seeded', (await one('select count(*)::int n from public.players')).n === 137)
  check('32 fixtures seeded', (await one('select count(*)::int n from public.matches')).n === 32)
  check('4 sample articles seeded', (await one('select count(*)::int n from public.articles')).n === 4)
  check('competition rules seeded', (await one('select count(*)::int n from public.tournament_rules')).n === 1)
  check('poll and fan-profile tables are removed', (await one(`
    select count(*)::int n from unnest(array[
      to_regclass('public.polls')::text,
      to_regclass('public.poll_options')::text,
      to_regclass('public.poll_votes')::text,
      to_regclass('public.match_predictions')::text,
      to_regclass('public.user_profiles')::text,
      to_regclass('public.favorite_teams')::text,
      to_regclass('public.favorite_players')::text,
      to_regclass('public.saved_matches')::text
    ]) t where t is not null
  `)).n === 0)
  check('public signup profile trigger is removed', (await one(`
    select count(*)::int n from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal
  `)).n === 0)
  check('prediction and poll RPCs are removed', (await one(`
    select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('poll_results', 'match_prediction_summary', 'prediction_leaderboard')
  `)).n === 0)
  check('no match results are seeded', (await one("select count(*)::int n from public.matches where status <> 'upcoming' or result_type is not null or winner_team_id is not null")).n === 0)
  check('media bucket exists', (await one("select count(*)::int n from storage.buckets where id = 'npl-media' and public")).n === 1)

  console.log('\nAuthentication and row-level security:')
  const adminId = '11111111-1111-4111-8111-111111111111'
  const regularId = '22222222-2222-4222-8222-222222222222'
  await db.query('insert into auth.users (id, email) values ($1, $2), ($3, $4)', [adminId, 'admin@example.com', regularId, 'user@example.com'])
  check('new auth users receive no fan role automatically', (await one('select count(*)::int n from public.user_roles')).n === 0)

  await db.exec('set role authenticated')
  await db.query(`select set_config('request.jwt.claim.sub', '${regularId}', false)`)
  check('regular account cannot read the administrator role', (await one('select count(*)::int n from public.user_roles')).n === 0)
  check('public visitors can read teams', (await one('select count(*)::int n from public.teams')).n === 8)
  const blocked = await db.query("update public.matches set status = 'completed' where id = 'npl-2026-m1'")
  check('unprivileged account cannot edit matches', (blocked.affectedRows ?? 0) === 0)
  check('unauthorized match remains unchanged', (await one("select status from public.matches where id = 'npl-2026-m1'")).status === 'upcoming')

  await db.exec('reset role')
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [adminId])
  await db.exec('set role authenticated')
  await db.query(`select set_config('request.jwt.claim.sub', '${adminId}', false)`)
  check('administrator can read its own role for access verification', (await one('select role from public.user_roles')).role === 'admin')
  check('promoted account passes admin check', (await one('select public.is_admin() ok')).ok === true)
  await db.query("update public.matches set status = 'completed', result_type = 'win', winner_team_id = 'lumbini-lions' where id = 'npl-2026-m1'")
  check('admin can update a match', (await one("select status from public.matches where id = 'npl-2026-m1'")).status === 'completed')
  await db.exec('reset role')

  console.log('\nScorecards and server API quota:')
  await db.exec(`
    update public.matches set status = 'completed', result_type = 'win', winner_team_id = 'lumbini-lions', result_summary = 'Lumbini Lions won by 7 runs' where id = 'npl-2026-m1';
    insert into public.match_innings (match_id, team_id, runs, wickets, overs, innings_no) values
      ('npl-2026-m1', 'lumbini-lions', 165, 6, 20, 1),
      ('npl-2026-m1', 'sudurpaschim-royals', 158, 9, 20, 2);
    insert into public.batting_scorecards (match_id, player_id, team_id, runs, balls, fours, sixes, out)
      values ('npl-2026-m1', 'rohit-paudel', 'lumbini-lions', 72, 46, 6, 4, true);
  `)
  check('innings and scorecards accept valid figures', (await one('select count(*)::int n from public.batting_scorecards')).n === 1)
  try {
    await db.exec("insert into public.match_innings (match_id, team_id, runs, wickets, overs, innings_no) values ('npl-2026-m1', 'sudurpaschim-royals', 100, 11, 20, 3)")
    check('wicket limit is enforced', false)
  } catch {
    check('wicket limit is enforced', true)
  }

  await db.exec('set role service_role')
  const quotaDate = '2026-10-23'
  check('server can consume API quota', (await one('select allowed from public.cricketdata_try_consume($1::date, 1)', [quotaDate])).allowed === true)
  check('server quota stops overuse', (await one('select allowed from public.cricketdata_try_consume($1::date, 1)', [quotaDate])).allowed === false)
  await db.exec('reset role')
} catch (error) {
  console.error('\nSQL verification crashed:', error)
  failures += 1
} finally {
  await db.close()
}

if (failures) {
  console.error(`\n${failures} SQL check(s) failed.`)
  process.exitCode = 1
} else console.log('\nAll SQL checks passed.')
