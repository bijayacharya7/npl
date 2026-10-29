import { matchLocalFixture, normalizeName, resolveTeamId } from './mapper.js'

export const SPORTMONKS_LEAGUE_ID = 452
export const SPORTMONKS_BASE_URL = 'https://cricket.sportmonks.com/api/v2.0'

function nplDate(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function rows(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function playerLookup(players, name, teamId, providerId) {
  const normalized = normalizeName(name)
  const sameTeam = players.filter((player) => !teamId || player.teamId === teamId)
  const player = sameTeam.find((row) => normalizeName(row.name) === normalized) ??
    sameTeam.find((row) => normalized && (normalizeName(row.name).includes(normalized) || normalized.includes(normalizeName(row.name))))
  return player?.id ?? (providerId ? `sportmonks-${providerId}` : `sportmonks-${normalized.replace(/\s+/g, '-')}`)
}

function completed(status) {
  return /finished|completed|won by|abandoned|no result/i.test(String(status ?? ''))
}

function unwrap(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (value?.data && typeof value.data === 'object') return value.data
  return value ?? {}
}

export function mapSportmonksFixture(fixture, localMatches, teams, players = [], now = Date.now()) {
  const localteam = unwrap(fixture?.localteam)
  const visitorteam = unwrap(fixture?.visitorteam)
  const leagueData = unwrap(fixture?.league)
  const localTeam = localteam?.name
  const visitorTeam = visitorteam?.name
  const league = leagueData?.name ?? ''
  const leagueId = Number(fixture?.league_id ?? fixture?.league?.id ?? fixture?.league?.data?.id)
  if (leagueId !== SPORTMONKS_LEAGUE_ID && !/nepal premier league/i.test(league)) return null

  const startedAt = fixture?.starting_at ?? fixture?.startingAt
  if (!startedAt || !localTeam || !visitorTeam) return null
  const date = nplDate(startedAt)
  const match = matchLocalFixture({
    name: `${localTeam} vs ${visitorTeam}`,
    teams: [localTeam, visitorTeam],
    date,
  }, localMatches, teams).local
  if (!match || match.verifiedSchedule === false) return null

  const teamIdsByProviderId = new Map()
  const localTeamId = resolveTeamId(localTeam, teams)
  const visitorTeamId = resolveTeamId(visitorTeam, teams)
  const providerLocalId = fixture.localteam_id ?? localteam?.id
  const providerVisitorId = fixture.visitorteam_id ?? visitorteam?.id
  if (localTeamId && providerLocalId != null) teamIdsByProviderId.set(String(providerLocalId), localTeamId)
  if (visitorTeamId && providerVisitorId != null) teamIdsByProviderId.set(String(providerVisitorId), visitorTeamId)
  const inningsRuns = rows(fixture.runs)
  const innings = inningsRuns.map((row, index) => {
    const teamId = teamIdsByProviderId.get(String(row.team_id))
    if (!teamId) return null
    return {
      id: `sportmonks-${match.id}-${row.inning ?? index + 1}`,
      number: Number(row.inning ?? index + 1),
      teamId,
      runs: Number(row.score ?? row.runs) || 0,
      wickets: Number(row.wickets) || 0,
      overs: Number(row.overs) || 0,
    }
  }).filter(Boolean)

  const lineup = rows(fixture.lineup)
  const playersByProviderId = new Map(lineup.map((player) => {
    const details = unwrap(player.player)
    return [String(player.id ?? player.player_id), player.fullname ?? player.name ?? details.fullname ?? details.name ?? '']
  }))
  const activeInnings = innings.at(-1)
  const battingRows = rows(fixture.batting)
  const bowlingRows = rows(fixture.bowling)
  const batting = battingRows.map((row) => {
    const name = row.fullname ?? row.player?.fullname ?? row.player?.data?.fullname ?? playersByProviderId.get(String(row.player_id)) ?? ''
    const teamId = teamIdsByProviderId.get(String(row.team_id)) ?? activeInnings?.teamId ?? null
    return {
      matchId: match.id,
      playerId: playerLookup(players, name, teamId, row.player_id),
      playerName: name || 'Player', teamId,
      runs: Number(row.score) || 0, balls: Number(row.ball) || 0,
      fours: Number(row.four_x) || 0, sixes: Number(row.six_x) || 0,
      out: Boolean(row.dismissal), active: Boolean(row.active),
      strikeRate: Number(row.rate) || 0, dismissal: row.dismissal ?? null,
      source: 'sportmonks',
    }
  })
  const bowling = bowlingRows.map((row) => {
    const name = row.fullname ?? row.player?.fullname ?? row.player?.data?.fullname ?? playersByProviderId.get(String(row.player_id)) ?? ''
    const teamId = teamIdsByProviderId.get(String(row.team_id)) ?? null
    return {
      matchId: match.id,
      playerId: playerLookup(players, name, teamId, row.player_id),
      playerName: name || 'Player', teamId,
      overs: String(row.overs ?? '0'), maidens: Number(row.medians ?? row.maidens) || 0,
      runsConceded: Number(row.runs) || 0, wickets: Number(row.wickets) || 0,
      economy: Number(row.rate) || 0, active: Boolean(row.active), source: 'sportmonks',
    }
  })

  const balls = rows(fixture.balls).map((ball) => {
    const score = ball.score ?? {}
    const number = String(ball.ball ?? '')
    const [over = '', delivery = ''] = number.split('.')
    const bowler = playersByProviderId.get(String(ball.bowler_id))
    const batter = playersByProviderId.get(String(ball.batsman_id))
    const outcome = score.name ?? `${Number(score.runs) || 0} run${Number(score.runs) === 1 ? '' : 's'}`
    return {
      id: String(ball.id ?? `${number}-${ball.bowler_id}-${ball.batsman_id}`),
      over, ball: delivery,
      text: [bowler, batter && `to ${batter}`, outcome].filter(Boolean).join(' '),
      runs: Number(score.runs) || 0, wicket: Boolean(score.is_wicket),
      timestamp: ball.updated_at ?? null,
    }
  }).slice(-24).reverse()

  const statusText = fixture.note ?? fixture.status ?? ''
  const liveFlag = fixture.live === true || fixture.live === 1 || fixture.live === 'true'
  const isCompleted = completed(statusText) || fixture.status === 'Finished' || fixture.status === 'Completed' || /finished|completed/i.test(String(fixture.status ?? '')) || /abandoned|no result/i.test(String(fixture.status ?? ''))
  const isLive = !isCompleted && (liveFlag || /innings|live|in progress|break/i.test(String(statusText)))
  const status = isCompleted ? 'completed' : isLive ? 'live' : 'upcoming'
  const activeBatters = batting.filter((row) => row.active).slice(-2)
  const activeBowlers = bowling.filter((row) => row.active).slice(-2)
  const summary = statusText || null

  let result = null
  if (isCompleted && summary) {
    if (/abandon|no result/i.test(String(fixture.status ?? summary))) {
      result = { type: 'no-result', winnerTeamId: null, margin: null, summary }
    } else {
      // Try to determine winner from innings
      let winnerTeamId = null
      if (innings.length >= 2) {
        const sorted = [...innings].sort((a, b) => b.runs - a.runs || b.wickets - a.wickets)
        if (sorted[0].runs !== sorted[1].runs) {
          winnerTeamId = sorted[0].teamId
        }
      } else      if (innings.length === 1 && summary) {
        // Sometimes only one innings shown but match completed
        const winner = teamIdsByProviderId.get(String(fixture.winner_team_id))
        if (winner) winnerTeamId = winner
      }
      result = { type: 'win', winnerTeamId, margin: null, summary }
    }
  }

  return {
    match: {
      matchId: match.id,
      providerMatchId: String(fixture.id ?? ''),
      status,
      statusNote: summary,
      innings,
      result,
      toss: fixture.tosswon_team_id ? {
        winnerTeamId: teamsByProviderId.get(String(fixture.tosswon_team_id)) ?? null,
        decision: fixture.elected ?? null,
        summary: `${localTeam} won the toss${fixture.elected ? ` and elected to ${fixture.elected}` : ''}`,
      } : null,
      dataSourceLabel: 'Sportmonks',
      statusSource: 'api',
      liveConfirmed: isLive,
      apiUpdatedAt: new Date(now).toISOString(),
      liveDetails: {
        source: 'Sportmonks', updatedAt: new Date(now).toISOString(),
        statusNote: summary, currentInnings: activeInnings?.number ?? null,
        currentBatters: activeBatters, currentBowlers: activeBowlers,
        batting, bowling, commentary: balls,
      },
      sportmonksFixtureId: String(fixture.id ?? ''),
    },
    scorecards: { batting, bowling, fielding: []    },
  }

}

export async function fetchSportmonksNplLive({ token, localMatches, teams, players = [], fetchImpl = globalThis.fetch, now = Date.now() }) {
  if (!token) return { matches: [], scorecards: { batting: [], bowling: [], fielding: [] }, fetchedAt: null }
  const url = new URL(`${SPORTMONKS_BASE_URL}/livescores`)
  url.searchParams.set('api_token', token)
  url.searchParams.set('include', 'localteam,visitorteam,league,season,runs,scoreboards,batting,bowling,lineup,balls')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  let response
  try {
    response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
  } finally {
    clearTimeout(timeout)
  }
  if (!response.ok) {
    const error = new Error(`Sportmonks returned HTTP ${response.status}.`)
    error.code = response.status === 429 ? 'RATE_LIMIT' : 'SPORTMONKS_HTTP'
    throw error
  }
  const body = await response.json()
  if (body?.error) {
    const error = new Error(String(body.error.message ?? 'Sportmonks rejected the live-score request.'))
    error.code = 'SPORTMONKS_PROVIDER'
    throw error
  }
  const liveFixtures = rows(body?.data)
  const mapped = liveFixtures
    .map((fixture) => mapSportmonksFixture(fixture, localMatches, teams, players, now))
    .filter(Boolean)
  return {
    matches: mapped.map((row) => row.match),
    scorecards: {
      batting: mapped.flatMap((row) => row.scorecards.batting),
      bowling: mapped.flatMap((row) => row.scorecards.bowling),
      fielding: [],
    },
    fetchedAt: new Date(now).toISOString(),
    liveMatches: mapped.filter((row) => row.match.status === 'live').length,
  }
}
