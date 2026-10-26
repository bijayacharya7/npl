/**
 * Cricket calculations for NPL Fan Zone.
 *
 * Everything here is pure JavaScript with no React or database dependency, so
 * it is easy to test and reuse. Standings and player leaderboards are DERIVED
 * from match and scorecard data - never stored as hand-written numbers.
 */

import { DEFAULT_POINTS_RULES } from '../data/tournament.js'

/* -------------------------------------------------------------------------- */
/* Overs helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Convert cricket overs (e.g. 19.4 = 19 overs and 4 balls) to legal balls.
 * Accepts numbers or strings, and tolerates values like "19.4".
 */
export function oversToBalls(overs) {
  if (overs === null || overs === undefined || overs === '') return 0
  const value = typeof overs === 'string' ? Number(overs.trim()) : Number(overs)
  if (!Number.isFinite(value) || value < 0) return 0
  const completedOvers = Math.floor(value)
  const balls = Math.round((value - completedOvers) * 10)
  return completedOvers * 6 + Math.min(balls, 5)
}

/** Convert legal balls back to display overs, e.g. 118 -> "19.4". */
export function ballsToOvers(balls) {
  const safe = Math.max(0, Math.round(Number(balls) || 0))
  return `${Math.floor(safe / 6)}.${safe % 6}`
}

/* -------------------------------------------------------------------------- */
/* Standings                                                                   */
/* -------------------------------------------------------------------------- */

function blankRow(teamId) {
  return {
    teamId,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    points: 0,
    runsFor: 0,
    ballsFor: 0,
    runsAgainst: 0,
    ballsAgainst: 0,
    nrr: 0,
    form: [],
  }
}

export function resultType(match) {
  if (!match) return null
  if (match.status === 'abandoned') return 'no-result'
  if (match.result?.type) return match.result.type
  if (match.status !== 'completed') return null
  if (match.result?.winnerTeamId) return 'win'
  return null
}

/**
 * Net run rate from totals whose balls have ALREADY been normalised for the
 * all-out rule (see chargedBallsForInnings). Keeping this as a pure formula
 * avoids applying the all-out rule twice.
 */
export function netRunRate({ runsFor, ballsFor, runsAgainst, ballsAgainst }) {
  if (!ballsFor || !ballsAgainst) return 0
  const scored = runsFor / (ballsFor / 6)
  const conceded = runsAgainst / (ballsAgainst / 6)
  const nrr = scored - conceded
  return Number.isFinite(nrr) ? nrr : 0
}

/**
 * Balls charged to a team for NRR purposes. An all-out team that batted fewer
 * than the full quota is treated as having faced the full quota.
 */
export function chargedBallsForInnings(innings, rules = DEFAULT_POINTS_RULES) {
  const quotaBalls = rules.oversPerInnings * 6
  const balls = oversToBalls(innings?.overs)
  const allOut = Number(innings?.wickets) >= 10
  return rules.allOutUsesFullQuota && allOut && balls < quotaBalls ? quotaBalls : balls
}

/**
 * Build a league table from match data.
 *
 * @param {Array} matches  all matches (playoffs are ignored)
 * @param {Array} teams    team records (for ordering fallback)
 * @param {object} rules   points rules
 * @param {string} stage    which stage contributes to the table (default league)
 */
export function computeStandings(matches = [], teams = [], rules = DEFAULT_POINTS_RULES, stage = 'league') {
  const rows = new Map()

  for (const team of teams) rows.set(team.id, blankRow(team.id))

  const leagueMatches = matches.filter(
    (m) => m.stage === stage && m.homeTeamId && m.awayTeamId && rows.has(m.homeTeamId) && rows.has(m.awayTeamId),
  )

  for (const match of leagueMatches) {
    const type = resultType(match)
    if (!type) continue

    const home = rows.get(match.homeTeamId)
    const away = rows.get(match.awayTeamId)
    home.played += 1
    away.played += 1

    if (type === 'no-result') {
      home.noResult += 1
      away.noResult += 1
      home.points += rules.noResult
      away.points += rules.noResult
      home.form.push('NR')
      away.form.push('NR')
      continue
    }

    if (type === 'tie') {
      home.tied += 1
      away.tied += 1
      home.points += rules.tie
      away.points += rules.tie
      home.form.push('T')
      away.form.push('T')
    } else if (type === 'win') {
      const winnerId = match.result?.winnerTeamId
      if (!winnerId) continue
      const winner = rows.get(winnerId)
      const loser = winnerId === match.homeTeamId ? away : home
      winner.won += 1
      winner.points += rules.win
      loser.lost += 1
      loser.points += rules.loss
      winner.form.push('W')
      loser.form.push('L')
    }

    // Add runs/overs for both innings when present.
    const innings = Array.isArray(match.innings) ? match.innings : []
    for (const inningsRow of innings) {
      const row = rows.get(inningsRow.teamId)
      if (!row) continue
      const chargedBalls = chargedBallsForInnings(inningsRow, rules)
      row.runsFor += Number(inningsRow.runs) || 0
      row.ballsFor += chargedBalls
      const opponent = inningsRow.teamId === match.homeTeamId ? away : home
      opponent.runsAgainst += Number(inningsRow.runs) || 0
      opponent.ballsAgainst += chargedBalls
    }
  }

  const result = [...rows.values()].map((row) => ({
    ...row,
    nrr: netRunRate(row),
  }))

  for (const row of result) {
    row.headToHeadWins = {}
    for (const other of result) {
      if (other.teamId === row.teamId) continue
      row.headToHeadWins[other.teamId] = 0
    }
  }
  for (const match of leagueMatches) {
    if (resultType(match) !== 'win') continue
    const winnerId = match.result?.winnerTeamId
    const loserId = winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId
    const row = result.find((r) => r.teamId === winnerId)
    if (row && row.headToHeadWins[loserId] !== undefined) row.headToHeadWins[loserId] += 1
  }

  const teamById = new Map(teams.map((t) => [t.id, t]))
  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    for (const breaker of rules.tieBreakers) {
      if (breaker === 'nrr') {
        const diff = Number(b.nrr.toFixed(4)) - Number(a.nrr.toFixed(4))
        if (diff !== 0) return diff
      } else if (breaker === 'wins') {
        if (b.won !== a.won) return b.won - a.won
      } else if (breaker === 'headToHead') {
        const aOverB = a.headToHeadWins?.[b.teamId] ?? 0
        const bOverA = b.headToHeadWins?.[a.teamId] ?? 0
        if (bOverA !== aOverB) return bOverA - aOverB
      } else if (breaker === 'name') {
        const aName = teamById.get(a.teamId)?.name ?? a.teamId
        const bName = teamById.get(b.teamId)?.name ?? b.teamId
        return aName.localeCompare(bName)
      }
    }
    return 0
  })

  result.forEach((row, index) => {
    row.position = index + 1
  })

  return result
}

/** Format NRR the way cricket tables do: +0.123 / -0.456 / 0.000. */
export function formatNRR(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return '0.000'
  return `${n > 0 ? '+' : '-'}${Math.abs(n).toFixed(3)}`
}

/* -------------------------------------------------------------------------- */
/* Player statistics                                                          */
/* -------------------------------------------------------------------------- */

function bestBowling(a, b) {
  if (!a) return b
  if (!b) return a
  if (b.wickets !== a.wickets) return b.wickets > a.wickets ? b : a
  return b.runsConceded < a.runsConceded ? b : a
}

/**
 * Aggregate batting / bowling / fielding scorecard rows.
 *
 * @param {object} data { batting, bowling, fielding, matches, players }
 */
export function computePlayerStats({ batting = [], bowling = [], fielding = [], matches = [], players = [] } = {}) {
  const completedIds = new Set(
    matches
      .filter((m) => m.status === 'completed' || m.status === 'abandoned')
      .map((m) => m.id),
  )
  const allowAll = completedIds.size === 0
  const playerById = new Map(players.map((p) => [p.id, p]))
  const stats = new Map()

  const ensure = (playerId) => {
    if (!stats.has(playerId)) {
      const player = playerById.get(playerId)
      stats.set(playerId, {
        playerId,
        player,
        teamId: player?.teamId ?? null,
        innings: 0,
        notOuts: 0,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        highScore: null,
        highScoreNotOut: false,
        fifties: 0,
        hundreds: 0,
        dismissals: 0,
        wickets: 0,
        ballsBowled: 0,
        runsConceded: 0,
        maidens: 0,
        bestBowling: null,
        catches: 0,
        stumpings: 0,
      })
    }
    return stats.get(playerId)
  }

  for (const row of batting) {
    if (!allowAll && !completedIds.has(row.matchId)) continue
    const s = ensure(row.playerId)
    const runs = Number(row.runs) || 0
    const balls = Number(row.balls) || 0
    s.innings += 1
    s.runs += runs
    s.ballsFaced += balls
    s.fours += Number(row.fours) || 0
    s.sixes += Number(row.sixes) || 0
    if (row.out === false || row.dismissal === 'not out') {
      s.notOuts += 1
      if (s.highScore === null || runs > s.highScore) {
        s.highScore = runs
        s.highScoreNotOut = true
      }
    } else {
      s.dismissals += 1
      if (s.highScore === null || runs > s.highScore) {
        s.highScore = runs
        s.highScoreNotOut = false
      }
    }
    if (runs >= 100) s.hundreds += 1
    else if (runs >= 50) s.fifties += 1
  }

  for (const row of bowling) {
    if (!allowAll && !completedIds.has(row.matchId)) continue
    const s = ensure(row.playerId)
    const balls = oversToBalls(row.overs)
    s.ballsBowled += balls
    s.runsConceded += Number(row.runsConceded) || 0
    s.wickets += Number(row.wickets) || 0
    s.maidens += Number(row.maidens) || 0
    s.bestBowling = bestBowling(s.bestBowling, {
      wickets: Number(row.wickets) || 0,
      runsConceded: Number(row.runsConceded) || 0,
    })
  }

  for (const row of fielding) {
    if (!allowAll && !completedIds.has(row.matchId)) continue
    const s = ensure(row.playerId)
    s.catches += Number(row.catches) || 0
    s.stumpings += Number(row.stumpings) || 0
  }

  const list = [...stats.values()].map((s) => {
    const battingInnings = s.innings
    const outs = battingInnings - s.notOuts
    const battingAverage = outs > 0 ? s.runs / outs : null
    const strikeRate = s.ballsFaced > 0 ? (s.runs / s.ballsFaced) * 100 : null
    const bowlingAverage = s.wickets > 0 ? s.runsConceded / s.wickets : null
    const economy = s.ballsBowled > 0 ? s.runsConceded / (s.ballsBowled / 6) : null
    const bowlingStrikeRate = s.wickets > 0 ? s.ballsBowled / s.wickets : null
    return {
      ...s,
      battingAverage,
      strikeRate,
      bowlingAverage,
      economy,
      bowlingStrikeRate,
    }
  })

  return list
}

export const LEADERBOARD_DEFINITIONS = [
  {
    id: 'runs',
    label: 'Most runs',
    unit: 'runs',
    value: (p) => p.runs,
    secondary: (p) => `${p.innings} inns · HS ${highScoreLabel(p)}`,
    filter: (p) => p.innings > 0,
  },
  {
    id: 'wickets',
    label: 'Most wickets',
    unit: 'wkts',
    value: (p) => p.wickets,
    secondary: (p) => `${ballsToOvers(p.ballsBowled)} overs · Econ ${decimal(p.economy)}`,
    filter: (p) => p.wickets > 0,
  },
  {
    id: 'highScore',
    label: 'Highest individual score',
    unit: 'runs',
    value: (p) => p.highScore ?? 0,
    secondary: (p) => `${p.innings} inns \u00b7 SR ${decimal(p.strikeRate)}`,
    filter: (p) => p.highScore !== null,
    format: (v) => String(v),
  },
  {
    id: 'battingAverage',
    label: 'Best batting average',
    unit: 'avg',
    value: (p) => p.battingAverage ?? 0,
    secondary: (p) => `${p.runs} runs · ${p.innings} inns`,
    filter: (p) => p.battingAverage !== null && p.innings >= 1,
    format: (v) => decimal(v),
  },
  {
    id: 'strikeRate',
    label: 'Best strike rate',
    unit: 'SR',
    value: (p) => p.strikeRate ?? 0,
    secondary: (p) => `${p.runs} runs off ${p.ballsFaced} balls`,
    filter: (p) => p.strikeRate !== null && p.ballsFaced >= 1,
    format: (v) => decimal(v),
  },
  {
    id: 'bowlingAverage',
    label: 'Best bowling average',
    unit: 'avg',
    value: (p) => p.bowlingAverage ?? Infinity,
    secondary: (p) => `${p.wickets} wkts · ${p.runsConceded} runs`,
    filter: (p) => p.bowlingAverage !== null,
    format: (v) => decimal(v),
    ascending: true,
  },
  {
    id: 'economy',
    label: 'Best economy',
    unit: 'econ',
    value: (p) => p.economy ?? Infinity,
    secondary: (p) => `${ballsToOvers(p.ballsBowled)} overs`,
    filter: (p) => p.economy !== null,
    format: (v) => decimal(v),
    ascending: true,
  },
  {
    id: 'sixes',
    label: 'Most sixes',
    unit: 'sixes',
    value: (p) => p.sixes,
    secondary: (p) => `${p.fours} fours`,
    filter: (p) => p.sixes > 0,
  },
  {
    id: 'fours',
    label: 'Most fours',
    unit: 'fours',
    value: (p) => p.fours,
    secondary: (p) => `${p.sixes} sixes`,
    filter: (p) => p.fours > 0,
  },
  {
    id: 'catches',
    label: 'Most catches',
    unit: 'catches',
    value: (p) => p.catches,
    secondary: (p) => `${p.stumpings} stumpings`,
    filter: (p) => p.catches > 0,
  },
  {
    id: 'stumpings',
    label: 'Most stumpings',
    unit: 'stumpings',
    value: (p) => p.stumpings,
    secondary: (p) => `${p.catches} catches`,
    filter: (p) => p.stumpings > 0,
  },
]

function decimal(value) {
  if (!Number.isFinite(value)) return '\u2014'
  return value.toFixed(2)
}

/** Public formatter used by the statistics page and tests. */
export function decimalOrDash(value) {
  return decimal(value)
}

export function highScoreLabel(player) {
  if (player.highScore === null || player.highScore === undefined) return '\u2014'
  return `${player.highScore}${player.highScoreNotOut ? '*' : ''}`
}

export function bestBowlingLabel(best) {
  if (!best) return '\u2014'
  return `${best.wickets}/${best.runsConceded}`
}

/** Build a sorted leaderboard from aggregated player stats. */
export function buildLeaderboard(stats, definition) {
  const rows = stats.filter((p) => definition.filter(p)).sort((a, b) => {
    const av = definition.value(a)
    const bv = definition.value(b)
    if (definition.ascending) return av - bv
    return bv - av
  })
  return rows
}

