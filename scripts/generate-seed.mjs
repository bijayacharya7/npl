/**
 * Generates supabase/seed.sql from the same JS seed data the app uses, so the
 * local demo and Supabase deployments never drift apart.
 *
 * Usage: npm run seed:sql
 */

import { writeFileSync } from 'node:fs'
import { TEAMS } from '../src/data/teams.js'
import { PLAYERS } from '../src/data/players.js'
import { MATCHES } from '../src/data/matches.js'
import { ARTICLES } from '../src/data/articles.js'
import { DEFAULT_POINTS_RULES } from '../src/data/tournament.js'

const q = (value) => {
  if (value === null || value === undefined) return 'null'
  return `'${String(value).replace(/'/g, "''")}'`
}
const num = (value) => (value === null || value === undefined || value === '' ? 'null' : Number(value))
const bool = (value) => (value ? 'true' : 'false')

const lines = []
lines.push('-- ============================================================================')
lines.push('-- NPL Fan Zone - seed data')
lines.push('-- GENERATED FILE: edit src/data/*.js and run `npm run seed:sql`.')
lines.push('-- Safe to re-run: existing rows are left untouched (on conflict do nothing).')
lines.push('-- ============================================================================')
lines.push('')
lines.push('begin;')
lines.push('')

lines.push('-- Teams')
for (const team of TEAMS) {
  lines.push(
    `insert into public.teams (id, name, short_name, abbreviation, city, province, primary_color, accent_color, description, captain, head_coach, previous_finish, image_url, source_label, source_url, last_verified) values (${q(
      team.id,
    )}, ${q(team.name)}, ${q(team.shortName)}, ${q(team.abbreviation)}, ${q(team.city)}, ${q(team.province)}, ${q(
      team.primaryColor,
    )}, ${q(team.accentColor)}, ${q(team.description)}, ${q(team.captain)}, ${q(team.headCoach)}, ${q(
      team.previousFinish,
    )}, null, ${q(team.source?.label)}, ${q(team.source?.url)}, ${q(team.lastVerified)}) on conflict (id) do nothing;`,
  )
}
lines.push('')

lines.push('-- Players')
for (const player of PLAYERS) {
  lines.push(
    `insert into public.players (id, team_id, name, role, nationality, is_captain, jersey_number, image_url, bio, verified, source_label, source_url, last_verified) values (${q(
      player.id,
    )}, ${q(player.teamId)}, ${q(player.name)}, ${q(player.role)}, ${q(player.nationality)}, ${bool(
      player.isCaptain,
    )}, ${num(player.jerseyNumber)}, null, ${q(player.bio)}, ${bool(player.verified)}, ${q(player.source?.label)}, ${q(
      player.source?.url,
    )}, ${q(player.lastVerified)}) on conflict (id) do nothing;`,
  )
}
lines.push('')

lines.push('-- Fixtures (no results are seeded)')
for (const match of MATCHES) {
  lines.push(
    `insert into public.matches (id, tournament_id, match_no, stage, home_team_id, away_team_id, home_label, away_label, start_time, venue, status, status_note, toss_winner_team_id, toss_decision, result_type, winner_team_id, result_margin, result_summary, player_of_match_id, summary, source_label, source_url, verified_schedule) values (${q(
      match.id,
    )}, 'npl-2026', ${match.matchNo}, ${q(match.stage)}, ${q(match.homeTeamId)}, ${q(match.awayTeamId)}, ${q(
      match.homeLabel,
    )}, ${q(match.awayLabel)}, ${q(match.startTime)}, ${q(match.venue)}, 'upcoming', ${q(
      match.statusNote,
    )}, null, null, null, null, null, null, null, null, ${q(match.source?.label)}, ${q(
      match.source?.url,
    )}, ${bool(match.verifiedSchedule)}) on conflict (id) do nothing;`,
  )
}
lines.push('')

lines.push('-- Sample articles (marked is_sample = true)')
for (const article of ARTICLES) {
  lines.push(
    `insert into public.articles (id, slug, title, excerpt, category, author, content, cover_image_url, related_team_id, related_player_id, status, is_sample, seo_title, seo_description, published_at) values (${q(
      article.id,
    )}, ${q(article.slug)}, ${q(article.title)}, ${q(article.excerpt)}, ${q(article.category)}, ${q(
      article.author,
    )}, ${q(JSON.stringify(article.content))}::jsonb, null, null, null, 'published', true, ${q(
      article.seoTitle,
    )}, ${q(article.seoDescription)}, ${q(article.publishedAt)}) on conflict (id) do nothing;`,
  )
}
lines.push('')

lines.push('-- Configurable standings rules')
lines.push(
  `insert into public.tournament_rules (tournament_id, win, tie, no_result, loss, all_out_uses_full_quota, overs_per_innings, tie_breakers) values ('npl-2026', ${DEFAULT_POINTS_RULES.win}, ${DEFAULT_POINTS_RULES.tie}, ${DEFAULT_POINTS_RULES.noResult}, ${DEFAULT_POINTS_RULES.loss}, ${bool(DEFAULT_POINTS_RULES.allOutUsesFullQuota)}, ${DEFAULT_POINTS_RULES.oversPerInnings}, array[${DEFAULT_POINTS_RULES.tieBreakers
    .map((value) => q(value))
    .join(', ')}]::text[]) on conflict (tournament_id) do nothing;`,
)
lines.push('')
lines.push('commit;')
lines.push('')

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), lines.join('\n'), 'utf8')
console.log(`Wrote supabase/seed.sql (${TEAMS.length} teams, ${PLAYERS.length} players, ${MATCHES.length} matches).`)
