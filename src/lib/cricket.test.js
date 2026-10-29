import { describe, it, expect } from 'vitest'
import {
  oversToBalls,
  ballsToOvers,
  computeStandings,
  formatNRR,
  netRunRate,
  chargedBallsForInnings,
  computePlayerStats,
  buildLeaderboard,
  LEADERBOARD_DEFINITIONS,
} from './cricket.js'
import { DEFAULT_POINTS_RULES } from '../data/tournament.js'

const teams = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Bravo' },
  { id: 'c', name: 'Charlie' },
]

const baseMatch = (overrides = {}) => ({
  id: 'm1',
  stage: 'league',
  homeTeamId: 'a',
  awayTeamId: 'b',
  status: 'completed',
  result: { type: 'win', winnerTeamId: 'a' },
  innings: [
    { teamId: 'a', runs: 160, wickets: 6, overs: 20 },
    { teamId: 'b', runs: 150, wickets: 9, overs: 20 },
  ],
  ...overrides,
})

describe('overs helpers', () => {
  it('converts cricket overs to legal balls', () => {
    expect(oversToBalls(20)).toBe(120)
    expect(oversToBalls(19.4)).toBe(118)
    expect(oversToBalls('0.5')).toBe(5)
    expect(oversToBalls(null)).toBe(0)
  })

  it('converts balls back to overs for display', () => {
    expect(ballsToOvers(118)).toBe('19.4')
    expect(ballsToOvers(6)).toBe('1.0')
  })
})

describe('standings', () => {
  it('returns an accurate preseason table with zeroes', () => {
    const table = computeStandings([], teams)
    expect(table).toHaveLength(3)
    for (const row of table) {
      expect(row.played).toBe(0)
      expect(row.points).toBe(0)
      expect(row.nrr).toBe(0)
    }
    expect(table.map((r) => r.teamId).sort()).toEqual(['a', 'b', 'c'])
  })

  it('awards 2 points for a win and 0 for the loser', () => {
    const table = computeStandings([baseMatch()], teams)
    const a = table.find((r) => r.teamId === 'a')
    const b = table.find((r) => r.teamId === 'b')
    expect(a.won).toBe(1)
    expect(a.points).toBe(2)
    expect(b.lost).toBe(1)
    expect(b.points).toBe(0)
    expect(table[0].teamId).toBe('a')
  })

  it('handles ties and no-results', () => {
    const tie = baseMatch({
      id: 'm2',
      result: { type: 'tie', winnerTeamId: null },
      innings: [
        { teamId: 'a', runs: 150, wickets: 8, overs: 20 },
        { teamId: 'b', runs: 150, wickets: 7, overs: 20 },
      ],
    })
    const nr = baseMatch({
      id: 'm3',
      status: 'abandoned',
      result: null,
      innings: [],
    })
    const table = computeStandings([tie, nr], teams)
    const a = table.find((r) => r.teamId === 'a')
    expect(a.tied).toBe(1)
    expect(a.noResult).toBe(1)
    expect(a.played).toBe(2)
    expect(a.points).toBe(DEFAULT_POINTS_RULES.tie + DEFAULT_POINTS_RULES.noResult)
  })

  it('calculates NRR from innings data', () => {
    const table = computeStandings([baseMatch()], teams)
    const a = table.find((r) => r.teamId === 'a')
    const b = table.find((r) => r.teamId === 'b')
    expect(a.nrr).toBeCloseTo(160 / 20 - 150 / 20, 5)
    expect(b.nrr).toBeCloseTo(-0.5, 5)
  })

  it('charges an all-out side the full overs quota', () => {
    const match = baseMatch({
      innings: [
        { teamId: 'a', runs: 120, wickets: 10, overs: 15.2 },
        { teamId: 'b', runs: 121, wickets: 3, overs: 18 },
      ],
      result: { type: 'win', winnerTeamId: 'b' },
    })
    const table = computeStandings([match], teams)
    const a = table.find((r) => r.teamId === 'a')
    // Alpha scored 120 in a full 20 overs (all out rule), conceded 121 in 18.
    expect(a.nrr).toBeCloseTo(120 / 20 - 121 / 18, 5)
    expect(chargedBallsForInnings({ runs: 120, wickets: 10, overs: 15.2 })).toBe(120)
    expect(chargedBallsForInnings({ runs: 121, wickets: 3, overs: 18 })).toBe(108)
    expect(netRunRate({ runsFor: 120, ballsFor: 120, runsAgainst: 121, ballsAgainst: 108 })).toBeCloseTo(
      6 - 121 / 18,
      5,
    )
  })

  it('ignores incomplete matches and playoff matches', () => {
    const live = baseMatch({ id: 'm4', status: 'live', result: null })
    const final = baseMatch({ id: 'm5', stage: 'final' })
    const table = computeStandings([live, final], teams)
    expect(table.every((r) => r.played === 0)).toBe(true)
  })

  it('includes a live league match in a provisional table', () => {
    const live = baseMatch({
      id: 'm4',
      status: 'live',
      result: null,
      innings: [
        { teamId: 'a', runs: 161, wickets: 4, overs: 18 },
        { teamId: 'b', runs: 150, wickets: 8, overs: 20 },
      ],
    })
    const official = computeStandings([live], teams)
    const provisional = computeStandings([live], teams, DEFAULT_POINTS_RULES, 'league', { includeLive: true })
    expect(official.every((row) => row.played === 0)).toBe(true)
    expect(provisional.find((row) => row.teamId === 'a')).toMatchObject({ played: 1, won: 1, points: 2 })
    expect(provisional.find((row) => row.teamId === 'b')).toMatchObject({ played: 1, lost: 1, points: 0 })
  })

  it('breaks equal points by run rate', () => {
    const match1 = baseMatch({ id: 'm1' })
    const match2 = baseMatch({
      id: 'm2',
      homeTeamId: 'c',
      awayTeamId: 'b',
      result: { type: 'win', winnerTeamId: 'b' },
      innings: [
        { teamId: 'c', runs: 130, wickets: 8, overs: 20 },
        { teamId: 'b', runs: 131, wickets: 2, overs: 16 },
      ],
    })
    const table = computeStandings([match1, match2], teams)
    const a = table.find((r) => r.teamId === 'a')
    const b = table.find((r) => r.teamId === 'b')
    expect(a.points).toBe(b.points)
    expect(table[0].teamId).toBe('b') // B has the better NRR
  })

  it('formats NRR with a sign', () => {
    expect(formatNRR(0)).toBe('0.000')
    expect(formatNRR(1.2345)).toBe('+1.234')
    expect(formatNRR(-0.5)).toBe('-0.500')
  })
})

describe('player statistics', () => {
  it('uses not-outs when calculating batting average', () => {
    const stats = computePlayerStats({
      batting: [
        { matchId: 'm1', playerId: 'p1', runs: 60, balls: 40, fours: 5, sixes: 2, out: false },
        { matchId: 'm2', playerId: 'p1', runs: 40, balls: 30, fours: 3, sixes: 1, out: true },
      ],
      players: [{ id: 'p1', teamId: 'a', name: 'Player One' }],
    })
    const p = stats[0]
    expect(p.runs).toBe(100)
    expect(p.notOuts).toBe(1)
    expect(p.battingAverage).toBe(100) // 100 runs / 1 out
    expect(p.strikeRate).toBeCloseTo((100 / 70) * 100, 5)
    expect(p.highScore).toBe(60)
    expect(p.highScoreNotOut).toBe(true)
  })

  it('returns null average when a batter is never out', () => {
    const stats = computePlayerStats({
      batting: [{ matchId: 'm1', playerId: 'p1', runs: 30, balls: 20, out: false }],
      players: [{ id: 'p1', teamId: 'a' }],
    })
    expect(stats[0].battingAverage).toBeNull()
  })

  it('calculates economy from legal balls, not overs decimals', () => {
    const stats = computePlayerStats({
      bowling: [{ matchId: 'm1', playerId: 'p2', overs: 3.4, runsConceded: 21, wickets: 2 }],
      players: [{ id: 'p2', teamId: 'a' }],
    })
    const p = stats[0]
    expect(p.ballsBowled).toBe(22)
    expect(p.economy).toBeCloseTo(21 / (22 / 6), 5)
    expect(p.bowlingAverage).toBeCloseTo(10.5, 5)
  })

  it('sorts leaderboards and filters empty rows', () => {
    const stats = computePlayerStats({
      batting: [
        { matchId: 'm1', playerId: 'p1', runs: 80, balls: 50, sixes: 6, fours: 4, out: true },
        { matchId: 'm1', playerId: 'p2', runs: 20, balls: 10, sixes: 1, fours: 2, out: true },
      ],
      players: [{ id: 'p1', teamId: 'a' }, { id: 'p2', teamId: 'b' }],
    })
    const runsBoard = buildLeaderboard(stats, LEADERBOARD_DEFINITIONS.find((d) => d.id === 'runs'))
    expect(runsBoard.map((p) => p.playerId)).toEqual(['p1', 'p2'])
    const sixesBoard = buildLeaderboard(stats, LEADERBOARD_DEFINITIONS.find((d) => d.id === 'sixes'))
    expect(sixesBoard[0].sixes).toBe(6)
  })
})
