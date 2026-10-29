import { describe, expect, it, vi } from 'vitest'
import { MATCHES } from '../../data/matches.js'
import { TEAMS } from '../../data/teams.js'
import { fetchSportmonksNplLive, mapSportmonksFixture, SPORTMONKS_BASE_URL, SPORTMONKS_LEAGUE_ID } from './sportmonks.js'

const fixture = {
  id: 452001,
  league_id: SPORTMONKS_LEAGUE_ID,
  starting_at: '2026-10-28T11:15:00.000000Z',
  live: true,
  status: '2nd Innings',
  note: 'Sudurpaschim Royals need 60 runs from 60 balls',
  localteam_id: 7,
  visitorteam_id: 8,
  localteam: { id: 7, name: 'Pokhara Avengers' },
  visitorteam: { id: 8, name: 'Sudurpaschim Royals' },
  runs: [
    { team_id: 7, inning: 1, score: 145, wickets: 7, overs: 20 },
    { team_id: 8, inning: 2, score: 86, wickets: 3, overs: 10 },
  ],
  lineup: [
    { id: 51, fullname: 'Dipendra Singh Airee' },
    { id: 52, fullname: 'Ishan Pandey' },
    { id: 61, fullname: 'Aakash Chand' },
  ],
  batting: [
    { player_id: 51, team_id: 8, score: 26, ball: 20, four_x: 3, six_x: 0, rate: 130, active: true },
    { player_id: 52, team_id: 8, score: 10, ball: 10, four_x: 0, six_x: 1, rate: 100, active: true },
  ],
  bowling: [
    { player_id: 61, team_id: 7, overs: 1, medians: 0, runs: 12, wickets: 0, rate: 12, active: true },
  ],
  balls: [
    { id: 990, ball: 10.1, bowler_id: 61, batsman_id: 51, score: { name: '1 run', runs: 1, is_wicket: false } },
  ],
}

describe('Sportmonks live NPL integration', () => {
  const local = MATCHES.find((match) => match.matchNo === 4)

  it('maps a verified NPL fixture to live scores, batters, bowler and delivery commentary', () => {
    const mapped = mapSportmonksFixture(fixture, MATCHES, TEAMS, [], Date.parse('2026-10-28T12:00:00Z'))
    expect(mapped.match).toMatchObject({
      matchId: local.id,
      providerMatchId: '452001',
      status: 'live',
      dataSourceLabel: 'Sportmonks',
      innings: [
        { teamId: 'pokhara-avengers', runs: 145, wickets: 7, overs: 20 },
        { teamId: 'sudurpaschim-royals', runs: 86, wickets: 3, overs: 10 },
      ],
    })
    expect(mapped.match.liveDetails.currentBatters.map(({ playerName }) => playerName))
      .toEqual(['Dipendra Singh Airee', 'Ishan Pandey'])
    expect(mapped.match.liveDetails.currentBowlers[0]).toMatchObject({ playerName: 'Aakash Chand', wickets: 0 })
    expect(mapped.match.liveDetails.commentary[0]).toMatchObject({ over: '10', ball: '1', text: 'Aakash Chand to Dipendra Singh Airee 1 run' })
    expect(mapped.scorecards.batting).toHaveLength(2)
  })

  it('rejects unrelated and unmatchable fixtures instead of attaching the wrong score', () => {
    expect(mapSportmonksFixture({ ...fixture, league_id: 3 }, MATCHES, TEAMS)).toBeNull()
    expect(mapSportmonksFixture({ ...fixture, localteam: { name: 'Other' } }, MATCHES, TEAMS)).toBeNull()
  })

  it('keeps the provider token server-side and fetches all currently live fixtures with rich includes', async () => {
    let requested
    const fetchImpl = vi.fn(async (url) => {
      requested = new URL(url)
      return { ok: true, async json() { return { data: [fixture] } } }
    })
    const result = await fetchSportmonksNplLive({
      token: 'server-only-token', localMatches: MATCHES, teams: TEAMS, fetchImpl,
      now: Date.parse('2026-10-28T12:00:00Z'),
    })
    expect(requested.origin + requested.pathname).toBe(`${SPORTMONKS_BASE_URL}/livescores`)
    expect(requested.searchParams.get('api_token')).toBe('server-only-token')
    expect(requested.searchParams.get('include')).toContain('balls')
    expect(result.matches).toHaveLength(1)
    expect(result.liveMatches).toBe(1)
  })

  it('does not call the provider when no token is configured', async () => {
    const fetchImpl = vi.fn()
    const result = await fetchSportmonksNplLive({ token: '', localMatches: MATCHES, teams: TEAMS, fetchImpl })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(result.matches).toEqual([])
  })
})
