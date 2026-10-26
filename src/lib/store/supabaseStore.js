/**
 * Supabase-backed store.
 *
 * All privileged operations rely on Row Level Security policies defined in
 * `supabase/migrations`. The browser only ever holds the public anon key; there
 * are no service-role keys here. If a non-admin calls an admin method the
 * database rejects it and this layer surfaces a friendly permission error.
 */

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MEDIA_BUCKET, supabase } from '../supabase.js'

function client() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function friendlyError(error, fallback) {
  console.error('[NPL Fan Zone] Supabase error:', error)
  if (!error) return new Error(fallback)
  if (error.code === '42501' || /row-level security|permission denied/i.test(error.message ?? '')) {
    return new Error('You do not have permission to do that. Admin access is required.')
  }
  if (error.code === '23505') return new Error('That record already exists (duplicate value).')
  if (error.code === '23503') {
    return new Error('That record is linked to other data, so it cannot be changed or removed yet.')
  }
  if (error.code === 'PGRST116') return new Error('That record could not be found.')
  return new Error(`${fallback}${error.message ? ` (${error.message})` : ''}`)
}

async function run(query, fallback) {
  const { data, error } = await query
  if (error) throw friendlyError(error, fallback)
  return data
}

/* -------------------------------------------------------------------------- */
/* Row <-> app mappers                                                        */
/* -------------------------------------------------------------------------- */

const teamFromRow = (row) => ({
  id: row.id,
  name: row.name,
  shortName: row.short_name,
  abbreviation: row.abbreviation,
  city: row.city,
  province: row.province,
  primaryColor: row.primary_color,
  accentColor: row.accent_color,
  description: row.description,
  captain: row.captain,
  headCoach: row.head_coach,
  previousFinish: row.previous_finish,
  imageUrl: row.image_url,
  source: row.source_url ? { label: row.source_label, url: row.source_url } : null,
  lastVerified: row.last_verified,
})

const teamToRow = (team) => ({
  id: team.id,
  name: team.name,
  short_name: team.shortName ?? null,
  abbreviation: team.abbreviation,
  city: team.city ?? null,
  province: team.province ?? null,
  primary_color: team.primaryColor ?? null,
  accent_color: team.accentColor ?? null,
  description: team.description ?? null,
  captain: team.captain ?? null,
  head_coach: team.headCoach ?? null,
  previous_finish: team.previousFinish ?? null,
  image_url: team.imageUrl ?? null,
  source_label: team.source?.label ?? null,
  source_url: team.source?.url ?? null,
  last_verified: team.lastVerified ?? null,
})

const playerFromRow = (row) => ({
  id: row.id,
  teamId: row.team_id,
  name: row.name,
  role: row.role,
  nationality: row.nationality,
  isCaptain: row.is_captain,
  jerseyNumber: row.jersey_number,
  imageUrl: row.image_url,
  bio: row.bio,
  verified: row.verified,
  source: row.source_url ? { label: row.source_label, url: row.source_url } : null,
  lastVerified: row.last_verified,
})

const playerToRow = (player) => ({
  id: player.id,
  team_id: player.teamId,
  name: player.name,
  role: player.role ?? null,
  nationality: player.nationality ?? null,
  is_captain: Boolean(player.isCaptain),
  jersey_number: player.jerseyNumber ?? null,
  image_url: player.imageUrl ?? null,
  bio: player.bio ?? null,
  verified: Boolean(player.verified),
  source_label: player.source?.label ?? null,
  source_url: player.source?.url ?? null,
  last_verified: player.lastVerified ?? null,
})

const inningsFromRow = (row) => ({
  id: row.id,
  teamId: row.team_id,
  runs: row.runs,
  wickets: row.wickets,
  overs: row.overs,
  createdAt: row.created_at,
})

const matchFromRow = (row, innings = []) => ({
  id: row.id,
  tournamentId: row.tournament_id,
  matchNo: row.match_no,
  stage: row.stage,
  homeTeamId: row.home_team_id,
  awayTeamId: row.away_team_id,
  homeLabel: row.home_label,
  awayLabel: row.away_label,
  startTime: row.start_time,
  timezone: 'Asia/Kathmandu',
  venue: row.venue,
  status: row.status,
  statusNote: row.status_note,
  toss: row.toss_winner_team_id ? { winnerTeamId: row.toss_winner_team_id, decision: row.toss_decision } : null,
  innings: innings.map(inningsFromRow),
  result: row.result_type
    ? {
        type: row.result_type,
        winnerTeamId: row.winner_team_id,
        margin: row.result_margin,
        summary: row.result_summary,
      }
    : null,
  playerOfMatchId: row.player_of_match_id,
  summary: row.summary,
  source: row.source_url ? { label: row.source_label, url: row.source_url } : null,
  verifiedSchedule: row.verified_schedule,
  manualOverride: Boolean(row.manual_override),
  updatedAt: row.updated_at,
})

const matchToRow = (match) => ({
  id: match.id,
  tournament_id: match.tournamentId ?? 'npl-2026',
  match_no: Number(match.matchNo) || 1,
  stage: match.stage,
  home_team_id: match.homeTeamId ?? null,
  away_team_id: match.awayTeamId ?? null,
  home_label: match.homeLabel ?? null,
  away_label: match.awayLabel ?? null,
  start_time: match.startTime,
  venue: match.venue,
  status: match.status ?? 'upcoming',
  status_note: match.statusNote ?? null,
  toss_winner_team_id: match.toss?.winnerTeamId ?? null,
  toss_decision: match.toss?.decision ?? null,
  result_type: match.result?.type ?? null,
  winner_team_id: match.result?.winnerTeamId ?? null,
  result_margin: match.result?.margin ?? null,
  result_summary: match.result?.summary ?? null,
  player_of_match_id: match.playerOfMatchId ?? null,
  summary: match.summary ?? null,
  source_label: match.source?.label ?? null,
  source_url: match.source?.url ?? null,
  verified_schedule: Boolean(match.verifiedSchedule),
  manual_override: Boolean(match.manualOverride),
})

const articleFromRow = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  category: row.category,
  author: row.author,
  content: row.content ?? [],
  coverImageUrl: row.cover_image_url,
  relatedTeamId: row.related_team_id,
  relatedPlayerId: row.related_player_id,
  status: row.status,
  isSample: row.is_sample,
  seoTitle: row.seo_title,
  seoDescription: row.seo_description,
  publishedAt: row.published_at,
  updatedAt: row.updated_at,
})

const articleToRow = (article) => ({
  id: article.id,
  slug: article.slug,
  title: article.title,
  excerpt: article.excerpt,
  category: article.category,
  author: article.author,
  content: article.content ?? [],
  cover_image_url: article.coverImageUrl ?? null,
  related_team_id: article.relatedTeamId ?? null,
  related_player_id: article.relatedPlayerId ?? null,
  status: article.status ?? 'draft',
  is_sample: Boolean(article.isSample),
  seo_title: article.seoTitle ?? null,
  seo_description: article.seoDescription ?? null,
  published_at: article.publishedAt ?? null,
})

const battingFromRow = (row) => ({
  id: row.id,
  matchId: row.match_id,
  playerId: row.player_id,
  teamId: row.team_id,
  runs: row.runs,
  balls: row.balls,
  fours: row.fours,
  sixes: row.sixes,
  out: row.out,
  dismissal: row.dismissal,
})

const bowlingFromRow = (row) => ({
  id: row.id,
  matchId: row.match_id,
  playerId: row.player_id,
  teamId: row.team_id,
  overs: row.overs,
  maidens: row.maidens,
  runsConceded: row.runs_conceded,
  wickets: row.wickets,
})

const fieldingFromRow = (row) => ({
  id: row.id,
  matchId: row.match_id,
  playerId: row.player_id,
  teamId: row.team_id,
  catches: row.catches,
  stumpings: row.stumpings,
  runOuts: row.run_outs,
})

/* -------------------------------------------------------------------------- */

export const supabaseStore = {
  mode: 'supabase',

  async loadSnapshot() {
    const db = client()
    const [teams, players, matches, innings, articles, rules, batting, bowling, fielding] =
      await Promise.all([
        run(db.from('teams').select('*').order('name'), 'Could not load teams'),
        run(db.from('players').select('*').order('name'), 'Could not load players'),
        run(db.from('matches').select('*').order('match_no'), 'Could not load fixtures'),
        run(db.from('match_innings').select('*').order('created_at'), 'Could not load innings'),
        run(db.from('articles').select('*').order('published_at', { ascending: false }), 'Could not load articles'),
        run(db.from('tournament_rules').select('*').eq('tournament_id', 'npl-2026').maybeSingle(), 'Could not load rules'),
        run(db.from('batting_scorecards').select('*').order('created_at'), 'Could not load batting scorecards'),
        run(db.from('bowling_scorecards').select('*').order('created_at'), 'Could not load bowling scorecards'),
        run(db.from('fielding_scorecards').select('*').order('created_at'), 'Could not load fielding scorecards'),
      ])


    const inningsByMatch = new Map()
    for (const row of innings ?? []) {
      if (!inningsByMatch.has(row.match_id)) inningsByMatch.set(row.match_id, [])
      inningsByMatch.get(row.match_id).push(row)
    }
    return {
      teams: (teams ?? []).map(teamFromRow),
      players: (players ?? []).map(playerFromRow),
      matches: (matches ?? []).map((row) => matchFromRow(row, inningsByMatch.get(row.id) ?? [])),
      articles: (articles ?? []).map(articleFromRow),
      rules: rules
        ? {
            win: rules.win,
            tie: rules.tie,
            noResult: rules.no_result,
            loss: rules.loss,
            allOutUsesFullQuota: rules.all_out_uses_full_quota,
            oversPerInnings: rules.overs_per_innings,
            tieBreakers: rules.tie_breakers,
          }
        : undefined,
      scorecards: {
        batting: (batting ?? []).map(battingFromRow),
        bowling: (bowling ?? []).map(bowlingFromRow),
        fielding: (fielding ?? []).map(fieldingFromRow),
      },
      mode: 'supabase',
    }
  },

  /* -------------------------------- teams -------------------------------- */
  async saveTeam(team) {
    const row = teamToRow(team)
    await run(client().from('teams').upsert(row, { onConflict: 'id' }), 'Could not save team')
    return team
  },
  async deleteTeam(teamId) {
    await run(client().from('teams').delete().eq('id', teamId), 'Could not delete team')
  },

  /* ------------------------------- players ------------------------------- */
  async savePlayer(player) {
    const db = client()
    await run(db.from('players').upsert(playerToRow(player), { onConflict: 'id' }), 'Could not save player')
    if (player.isCaptain) {
      await run(
        db.from('players').update({ is_captain: false }).eq('team_id', player.teamId).neq('id', player.id),
        'Could not update captaincy',
      )
    }
    return player
  },
  async deletePlayer(playerId) {
    await run(client().from('players').delete().eq('id', playerId), 'Could not delete player')
  },

  /* ------------------------------- matches ------------------------------- */
  async saveMatch(match) {
    const db = client()
    await run(db.from('matches').upsert(matchToRow(match), { onConflict: 'id' }), 'Could not save match')
    await run(db.from('match_innings').delete().eq('match_id', match.id), 'Could not update innings')
    if (match.innings?.length) {
      const rows = match.innings.map((innings) => ({
        match_id: match.id,
        team_id: innings.teamId,
        runs: Number(innings.runs) || 0,
        wickets: Math.min(10, Math.max(0, Number(innings.wickets) || 0)),
        overs: Number(innings.overs) || 0,
      }))
      await run(db.from('match_innings').insert(rows), 'Could not save innings')
    }
    return match
  },
  async deleteMatch(matchId) {
    await run(client().from('matches').delete().eq('id', matchId), 'Could not delete match')
  },

  /* ------------------------------- articles ------------------------------ */
  async saveArticle(article) {
    await run(client().from('articles').upsert(articleToRow(article), { onConflict: 'id' }), 'Could not save article')
    return article
  },
  async deleteArticle(articleId) {
    await run(client().from('articles').delete().eq('id', articleId), 'Could not delete article')
  },

  /* -------------------------------- rules -------------------------------- */
  async saveRules(rules) {
    await run(
      client().from('tournament_rules').upsert(
        {
          tournament_id: 'npl-2026',
          win: Number(rules.win),
          tie: Number(rules.tie),
          no_result: Number(rules.noResult),
          loss: Number(rules.loss),
          all_out_uses_full_quota: Boolean(rules.allOutUsesFullQuota),
          overs_per_innings: Number(rules.oversPerInnings),
          tie_breakers: rules.tieBreakers,
        },
        { onConflict: 'tournament_id' },
      ),
      'Could not save competition rules',
    )
    return rules
  },

  /* ------------------------------- scorecards ---------------------------- */
  async saveScorecard(kind, row) {
    const db = client()
    if (kind === 'batting') {
      await run(
        db.from('batting_scorecards').upsert(
          {
            id: row.id,
            match_id: row.matchId,
            player_id: row.playerId,
            team_id: row.teamId,
            runs: Number(row.runs) || 0,
            balls: Number(row.balls) || 0,
            fours: Number(row.fours) || 0,
            sixes: Number(row.sixes) || 0,
            out: Boolean(row.out),
            dismissal: row.dismissal ?? null,
          },
          { onConflict: 'id' },
        ),
        'Could not save batting scorecard',
      )
    } else if (kind === 'bowling') {
      await run(
        db.from('bowling_scorecards').upsert(
          {
            id: row.id,
            match_id: row.matchId,
            player_id: row.playerId,
            team_id: row.teamId,
            overs: Number(row.overs) || 0,
            maidens: Number(row.maidens) || 0,
            runs_conceded: Number(row.runsConceded) || 0,
            wickets: Number(row.wickets) || 0,
          },
          { onConflict: 'id' },
        ),
        'Could not save bowling scorecard',
      )
    } else if (kind === 'fielding') {
      await run(
        db.from('fielding_scorecards').upsert(
          {
            id: row.id,
            match_id: row.matchId,
            player_id: row.playerId,
            team_id: row.teamId,
            catches: Number(row.catches) || 0,
            stumpings: Number(row.stumpings) || 0,
            run_outs: Number(row.runOuts) || 0,
          },
          { onConflict: 'id' },
        ),
        'Could not save fielding record',
      )
    } else {
      throw new Error('Unknown scorecard type.')
    }
    return row
  },
  async deleteScorecard(kind, id) {
    const table = {
      batting: 'batting_scorecards',
      bowling: 'bowling_scorecards',
      fielding: 'fielding_scorecards',
    }[kind]
    if (!table) throw new Error('Unknown scorecard type.')
    await run(client().from(table).delete().eq('id', id), 'Could not delete scorecard row')
  },

  /* -------------------------------- activity ----------------------------- */
  async listActivity(limit = 20) {
    const rows = await run(
      client().from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(limit),
      'Could not load activity log',
    )
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      action: row.action,
      entity: row.entity,
      detail: row.detail,
      createdAt: row.created_at,
    }))
  },
  async logActivity(action, entity, detail) {
    try {
      const { data } = await client().auth.getUser()
      await client().from('admin_activity_log').insert({
        user_id: data?.user?.id ?? null,
        user_name: data?.user?.user_metadata?.display_name ?? data?.user?.email ?? 'Admin',
        action,
        entity,
        detail,
      })
    } catch (error) {
      // Logging must never block the admin action that succeeded.
      console.warn('[NPL Fan Zone] Activity log failed:', error)
    }
  },

  /* --------------------------------- media ------------------------------- */
  async uploadImage(file, folder) {
    if (!file) throw new Error('Choose an image first.')
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Use a JPEG, PNG, WebP or GIF image.')
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 2 MB or smaller.')
    const db = client()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${folder}/${Date.now()}-${safeName}`
    const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw friendlyError(error, 'Could not upload image')
    const { data } = db.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    return data.publicUrl
  },
  async deleteImage(url) {
    if (!url || !url.startsWith('http')) return true
    const marker = `/${MEDIA_BUCKET}/`
    const index = url.indexOf(marker)
    if (index === -1) return true
    const path = decodeURIComponent(url.slice(index + marker.length).split('?')[0])
    const { error } = await client().storage.from(MEDIA_BUCKET).remove([path])
    if (error) throw friendlyError(error, 'Could not delete image')
    return true
  },
}
