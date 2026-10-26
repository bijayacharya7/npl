import { describe, expect, it } from 'vitest'
import { MATCHES, matchesForTeam } from './matches.js'
import { TEAMS } from './teams.js'
import { ALL_TIME_RUNS, ALL_TIME_WICKETS, RECORDS_AS_OF } from './records.js'
import { TOURNAMENT } from './tournament.js'

describe('NPL Season 3 published data', () => {
  it('has the announced 32 fixtures with unique IDs and match numbers', () => {
    expect(TEAMS).toHaveLength(8)
    expect(MATCHES).toHaveLength(TOURNAMENT.matchCount)
    expect(new Set(MATCHES.map((match) => match.id)).size).toBe(MATCHES.length)
    expect(new Set(MATCHES.map((match) => match.matchNo)).size).toBe(MATCHES.length)
    expect(MATCHES.map((match) => match.matchNo).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 32 }, (_, index) => index + 1),
    )
  })

  it('schedules each team once against every other team in the league stage', () => {
    const league = MATCHES.filter((match) => match.stage === 'league')
    expect(league).toHaveLength(28)

    for (const team of TEAMS) {
      const teamMatches = matchesForTeam(team.id, league)
      expect(teamMatches).toHaveLength(7)
      expect(new Set(teamMatches.map((match) => [match.homeTeamId, match.awayTeamId].sort().join(':'))).size)
        .toBe(7)
    }
  })

  it('uses the revised start times and leaves unplayed results blank', () => {
    expect(MATCHES[0].startTime).toBe('2026-10-26T17:00:00+05:45')
    for (const match of MATCHES) {
      expect(match.status).toBe('upcoming')
      expect(match.result).toBeNull()
      expect(match.innings).toEqual([])
      expect(match.startTime).toMatch(/T(?:12:30|17:00):00\+05:45$/)

      if (match.stage === 'league') {
        expect(TEAMS.some((team) => team.id === match.homeTeamId)).toBe(true)
        expect(TEAMS.some((team) => team.id === match.awayTeamId)).toBe(true)
      }
    }
  })

  it('labels historical record leaders through the completed 2025 season', () => {
    expect(RECORDS_AS_OF).toContain('through the 2025 season')
    expect(ALL_TIME_RUNS[0]).toMatchObject({ name: 'Rohit Paudel', runs: 555 })
    expect(ALL_TIME_WICKETS[0]).toMatchObject({ name: 'Scott Kuggeleijn', wickets: 27 })
  })
})
