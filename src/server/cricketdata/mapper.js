/**
 * Map CricketData.org JSON onto NPL Fan Zone match / scorecard shapes.
 * Pure functions — safe to unit test without network.
 */

export const TEAM_ALIASES = {
  'biratnagar-kings': ['biratnagar kings', 'biratnagar', 'bk'],
  'chitwan-rhinos': ['chitwan rhinos', 'chitwan', 'cr'],
  'janakpur-bolts': ['janakpur bolts', 'janakpur', 'jb'],
  'karnali-yaks': ['karnali yaks', 'karnali', 'ky'],
  'kathmandu-gurkhas': ['kathmandu gurkhas', 'kathmandu', 'kg', 'gurkhas'],
  'lumbini-lions': ['lumbini lions', 'lumbini', 'll'],
  'pokhara-avengers': ['pokhara avengers', 'pokhara', 'pa'],
  'sudurpaschim-royals': [
    'sudurpaschim royals',
    'sudur paschim royals',
    'sudurpaschim',
    'sudur paschim',
    'spr',
  ],
}

export function normalizeName(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function isNpl2026SeriesName(name) {
  const n = normalizeName(name)
  if (!n) return false
  if (!/\b2026\b/.test(n)) return false
  if (n.includes('nepal premier league')) return true
  if (/\bnpl\b/.test(n) && n.includes('nepal')) return true
  return false
}

export function resolveTeamId(name, teams = []) {
  const needle = normalizeName(name)
  if (!needle) return null
  for (const [id, aliases] of Object.entries(TEAM_ALIASES)) {
    // Short abbreviations (≤3 chars) must be an exact match to avoid false substring hits.
    // E.g. 'pa' must not match inside 'sudurpaschim'.
    if (
      aliases.some((alias) =>
        needle === alias || (alias.length > 3 && needle.includes(alias)),
      )
    )
      return id
  }
  for (const team of teams) {
    const candidates = [team.name, team.shortName, team.abbreviation, team.city]
    if (candidates.some((value) => normalizeName(value) && needle.includes(normalizeName(value)))) {
      return team.id
    }
  }
  return null
}

export function parseTeamsFromMatch(apiMatch, teams = []) {
  const listed = Array.isArray(apiMatch?.teams) ? apiMatch.teams : []
  const fromList = listed.map((name) => resolveTeamId(name, teams)).filter(Boolean)
  if (fromList.length >= 2) return [fromList[0], fromList[1]]

  const name = String(apiMatch?.name ?? '')
  const vs = name.split(/\s+vs\.?\s+/i)
  if (vs.length >= 2) {
    const left = resolveTeamId(vs[0], teams)
    const right = resolveTeamId(vs[1].split(',')[0], teams)
    if (left && right) return [left, right]
  }
  return fromList
}

export function classifyMatchStatus(statusText) {
  const text = String(statusText ?? '').toLowerCase()
  if (!text) return 'upcoming'
  if (/abandon|no result|washed|cancelled|canceled/.test(text)) return 'abandoned'
  if (/postpon/.test(text)) return 'postponed'
  if (/won by|match tied|tied \(/.test(text)) return 'completed'
  if (
    /\blive\b|in progress|opt to|chose to|need \d+|requires \d+|overs remaining|stumps|innings break|rain delay/.test(
      text,
    )
  ) {
    return 'live'
  }
  if (/match starts|starts at|yet to begin|not started/.test(text)) return 'upcoming'
  return 'upcoming'
}

export function mapInnings(apiMatch, teamIds) {
  const scores = Array.isArray(apiMatch?.score) ? apiMatch.score : []
  const innings = []
  for (const row of scores) {
    const teamId = resolveTeamId(row.team ?? row.inning, []) || null
    const mappedId =
      teamId && teamIds.includes(teamId)
        ? teamId
        : teamIds.find((id) => normalizeName(row.inning ?? '').includes(id.split('-')[0])) ?? teamId
    if (!mappedId) continue
    innings.push({
      teamId: mappedId,
      runs: Number(row.r) || 0,
      wickets: Number(row.w) || 0,
      overs: Number(row.o) || 0,
    })
  }
  return innings
}

export function mapResult(statusText, teamIds, teamsById = {}) {
  const text = String(statusText ?? '')
  const lower = text.toLowerCase()
  if (/match tied|\btied\b/.test(lower) && !/won/.test(lower)) {
    return { type: 'tie', winnerTeamId: null, margin: null, summary: text }
  }
  if (/abandon|no result/.test(lower)) {
    return { type: 'no-result', winnerTeamId: null, margin: null, summary: text }
  }
  const winnerId = teamIds.find((id) => {
    const team = teamsById[id]
    if (!team) return false
    return lower.includes(normalizeName(team.name)) || lower.includes(normalizeName(team.shortName))
  })
  if (winnerId) {
    return { type: 'win', winnerTeamId: winnerId, margin: null, summary: text }
  }
  if (classifyMatchStatus(text) === 'completed') {
    return { type: 'win', winnerTeamId: null, margin: null, summary: text }
  }
  return null
}

export function pickNpl2026Series(seriesList = []) {
  const rows = Array.isArray(seriesList) ? seriesList : []
  const matches = rows.filter((row) => isNpl2026SeriesName(row?.name))
  if (!matches.length) return null
  matches.sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))
  return matches[0]
}

function nptDate(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso).slice(0, 10)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(date)
}

export function matchLocalFixture(apiMatch, localMatches = [], teams = []) {
  const teamIds = parseTeamsFromMatch(apiMatch, teams)
  const apiDate = String(apiMatch?.date ?? apiMatch?.dateTimeGMT ?? '').slice(0, 10)
  const stageHint = String(apiMatch?.name ?? '').toLowerCase()

  const dated = localMatches.filter((local) => {
    const localDate = nptDate(local.startTime) ?? String(local.startTime).slice(0, 10)
    return apiDate && localDate === apiDate
  })

  const byTeams = dated.filter((local) => {
    if (teamIds.length < 2) return false
    const pair = new Set([local.homeTeamId, local.awayTeamId])
    return teamIds.every((id) => pair.has(id))
  })
  if (byTeams.length === 1) return { local: byTeams[0], teamIds }
  if (byTeams.length > 1) return { local: byTeams[0], teamIds }

  if (teamIds.length === 2) {
    const any = localMatches.filter((local) => {
      const pair = new Set([local.homeTeamId, local.awayTeamId])
      return teamIds.every((id) => pair.has(id))
    })
    if (any.length === 1) return { local: any[0], teamIds }
  }

  const playoff = dated.find((local) => {
    if (local.stage === 'league') return false
    if (stageHint.includes('final') && local.stage === 'final') return true
    if (stageHint.includes('eliminator') && local.stage === 'eliminator') return true
    if (stageHint.includes('qualifier 2') && local.stage === 'qualifier2') return true
    if (stageHint.includes('qualifier 1') && local.stage === 'qualifier1') return true
    return false
  })
  if (playoff) return { local: playoff, teamIds }

  return { local: null, teamIds }
}

export function overlayFromApiMatch(apiMatch, localMatch, teams = []) {
  const teamsById = Object.fromEntries(teams.map((team) => [team.id, team]))
  const { local, teamIds } = localMatch
    ? { local: localMatch, teamIds: parseTeamsFromMatch(apiMatch, teams) }
    : matchLocalFixture(apiMatch, [], teams)
  if (!local) return null

  const status = classifyMatchStatus(apiMatch.status)
  const innings = mapInnings(apiMatch, [local.homeTeamId, local.awayTeamId].filter(Boolean))
  const result = status === 'completed' || status === 'abandoned' ? mapResult(apiMatch.status, teamIds, teamsById) : null

  return {
    matchId: local.id,
    providerMatchId: apiMatch.id ?? null,
    status,
    statusNote: apiMatch.status ?? null,
    innings,
    result,
    venue: apiMatch.venue ?? null,
    fantasyEnabled: Boolean(apiMatch.fantasyEnabled),
    seriesId: apiMatch.series_id ?? null,
    dateTimeGMT: apiMatch.dateTimeGMT ?? null,
  }
}

function playerNameOf(row) {
  return row?.batsman ?? row?.batter ?? row?.bowler ?? row?.name ?? row?.player ?? ''
}

export function mapScorecard(apiScorecard, localMatch, players = []) {
  const batting = []
  const bowling = []
  const fielding = []
  const cards = apiScorecard?.scorecard ?? apiScorecard?.scoreCard ?? apiScorecard?.innings ?? []
  if (!Array.isArray(cards) || !localMatch) {
    return { batting, bowling, fielding, supported: false }
  }

  const findPlayer = (name, teamId) => {
    const needle = normalizeName(name)
    if (!needle) return null
    const pool = players.filter((player) => !teamId || player.teamId === teamId)
    return (
      pool.find((player) => normalizeName(player.name) === needle) ??
      pool.find((player) => normalizeName(player.name).includes(needle) || needle.includes(normalizeName(player.name))) ??
      null
    )
  }

  let supported = false
  for (const card of cards) {
    const teamId =
      resolveTeamId(card.battingTeam ?? card.inning ?? card.team, []) ||
      (card.inning === 1 ? localMatch.homeTeamId : localMatch.awayTeamId)
    const batters = card.batting ?? card.batsmen ?? []
    const bowlers = card.bowling ?? card.bowlers ?? []
    if (batters.length || bowlers.length) supported = true

    for (const row of batters) {
      const player = findPlayer(playerNameOf(row), teamId)
      if (!player) continue
      const dismissal = String(row.dismissal ?? row['dismissal-text'] ?? row.out ?? '')
      const notOut = /not out|retired hurt/i.test(dismissal) || row.dismissal === false
      batting.push({
        matchId: localMatch.id,
        playerId: player.id,
        teamId: player.teamId,
        runs: Number(row.r ?? row.runs) || 0,
        balls: Number(row.b ?? row.balls) || 0,
        fours: Number(row['4s'] ?? row.fours) || 0,
        sixes: Number(row['6s'] ?? row.sixes) || 0,
        out: !notOut,
        dismissal: dismissal || null,
        source: 'cricketdata',
      })
    }
    for (const row of bowlers) {
      const player = findPlayer(playerNameOf(row), teamId === localMatch.homeTeamId ? localMatch.awayTeamId : localMatch.homeTeamId)
      if (!player) continue
      bowling.push({
        matchId: localMatch.id,
        playerId: player.id,
        teamId: player.teamId,
        overs: String(row.o ?? row.overs ?? '0'),
        maidens: Number(row.m ?? row.maidens) || 0,
        runsConceded: Number(row.r ?? row.runs) || 0,
        wickets: Number(row.w ?? row.wickets) || 0,
        source: 'cricketdata',
      })
    }
  }

  return { batting, bowling, fielding, supported }
}

export function localMatchIsInLiveWindow(match, now = Date.now(), windowAfterMs = 4 * 60 * 60 * 1000) {
  if (!match?.startTime) return false
  if (['completed', 'abandoned', 'postponed'].includes(match.status)) return false
  const start = new Date(match.startTime).getTime()
  if (!Number.isFinite(start)) return false
  const windowBeforeMs = 30 * 60 * 1000
  return now >= start - windowBeforeMs && now <= start + windowAfterMs
}

export function nplHasLiveWindow(localMatches = [], now = Date.now()) {
  return localMatches.some((match) => localMatchIsInLiveWindow(match, now))
}
