/**
 * CricketData.org integration tests.
 *
 * Covers:
 *  - Mapper: series-name detection, team resolution, status classification,
 *    innings mapping, scorecard parsing, result derivation.
 *  - Service / cache: cache hits, stale-then-refresh, quota exhaustion,
 *    single-flight (100 concurrent visitors => 1 API call), error fallback
 *    to stale data.
 *  - Quota: internal hard-limit of 80 stops automatic calls.
 *  - API key: never present in frontend helper module.
 *  - Merge: manual admin data is not overwritten by stale API overlay.
 */

import { describe, it, expect } from 'vitest'

import {
  isNpl2026SeriesName,
  pickNpl2026Series,
  resolveTeamId,
  parseTeamsFromMatch,
  classifyMatchStatus,
  mapInnings,
  mapResult,
  overlayFromApiMatch,
  mapScorecard,
  localMatchIsInLiveWindow,
  nplHasLiveWindow,
  normalizeName,
  matchLocalFixture,
} from '../server/cricketdata/mapper.js'

import { createCricketdataService } from '../server/cricketdata/service.js'
import { createMemoryStore } from '../server/cricketdata/store.js'
import { DATASETS } from '../server/cricketdata/config.js'
import { fetchKhelNowNplLive, khelnowInternals } from '../server/cricketdata/khelnow.js'
import { MATCHES } from '../data/matches.js'
import { TEAMS } from '../data/teams.js'
import { PLAYERS } from '../data/players.js'
import { applyScheduledLiveStatus, mergeMatch, isLiveFresh, mergeScorecards } from './cricketdata/merge.js'

/* =========================================================================
 * 1. Mapper - series name detection
 * ========================================================================= */

describe('isNpl2026SeriesName', () => {
  it('matches Nepal Premier League 2026', () => {
    expect(isNpl2026SeriesName('Nepal Premier League 2026')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(isNpl2026SeriesName('NEPAL PREMIER LEAGUE 2026')).toBe(true)
    expect(isNpl2026SeriesName('nepal premier league 2026')).toBe(true)
  })

  it('matches NPL 2026 Nepal shorthand', () => {
    expect(isNpl2026SeriesName('NPL 2026 Nepal')).toBe(true)
  })

  it('rejects wrong year', () => {
    expect(isNpl2026SeriesName('Nepal Premier League 2025')).toBe(false)
    expect(isNpl2026SeriesName('Nepal Premier League 2027')).toBe(false)
  })

  it('rejects other leagues', () => {
    expect(isNpl2026SeriesName('Indian Premier League 2026')).toBe(false)
    expect(isNpl2026SeriesName('Pakistan Super League 2026')).toBe(false)
  })

  it('rejects empty / null', () => {
    expect(isNpl2026SeriesName('')).toBe(false)
    expect(isNpl2026SeriesName(null)).toBe(false)
    expect(isNpl2026SeriesName(undefined)).toBe(false)
  })

  it('rejects series without 2026', () => {
    expect(isNpl2026SeriesName('Nepal Premier League')).toBe(false)
  })
})

describe('pickNpl2026Series', () => {
  it('returns the matching series', () => {
    const list = [
      { name: 'Bangladesh Premier League 2026', startDate: '2026-01-01', id: 'bpl' },
      { name: 'Nepal Premier League 2026', startDate: '2026-10-26', id: 'npl' },
    ]
    expect(pickNpl2026Series(list)?.id).toBe('npl')
  })

  it('returns null when no match', () => {
    expect(pickNpl2026Series([{ name: 'IPL 2026' }])).toBeNull()
  })

  it('prefers the latest start date when multiple match', () => {
    const list = [
      { name: 'Nepal Premier League 2026 Season A', startDate: '2026-04-01', id: 'a' },
      { name: 'Nepal Premier League 2026 Season B', startDate: '2026-10-26', id: 'b' },
    ]
    expect(pickNpl2026Series(list)?.id).toBe('b')
  })

  it('handles empty / non-array input', () => {
    expect(pickNpl2026Series([])).toBeNull()
    expect(pickNpl2026Series(null)).toBeNull()
    expect(pickNpl2026Series(undefined)).toBeNull()
  })
})

/* =========================================================================
 * 2. Mapper - team resolution
 * ========================================================================= */

describe('resolveTeamId', () => {
  const teams = [
    { id: 'pokhara-avengers', name: 'Pokhara Avengers', shortName: 'PA', abbreviation: 'POK', city: 'Pokhara' },
  ]

  it('resolves known aliases for all 8 NPL teams', () => {
    expect(resolveTeamId('Biratnagar Kings', [])).toBe('biratnagar-kings')
    expect(resolveTeamId('BK', [])).toBe('biratnagar-kings')
    expect(resolveTeamId('Chitwan Rhinos', [])).toBe('chitwan-rhinos')
    expect(resolveTeamId('Karnali Yaks', [])).toBe('karnali-yaks')
    expect(resolveTeamId('Sudurpaschim Royals', [])).toBe('sudurpaschim-royals')
    expect(resolveTeamId('Sudur Paschim Royals', [])).toBe('sudurpaschim-royals')
    expect(resolveTeamId('Kathmandu Gurkhas', [])).toBe('kathmandu-gurkhas')
    expect(resolveTeamId('Gurkhas', [])).toBe('kathmandu-gurkhas')
    expect(resolveTeamId('Lumbini Lions', [])).toBe('lumbini-lions')
    expect(resolveTeamId('Janakpur Bolts', [])).toBe('janakpur-bolts')
  })

  it('falls through to team list when alias does not match', () => {
    expect(resolveTeamId('Pokhara Avengers', teams)).toBe('pokhara-avengers')
  })

  it('returns null for unknown names', () => {
    expect(resolveTeamId('Mumbai Indians', [])).toBeNull()
    expect(resolveTeamId('', [])).toBeNull()
    expect(resolveTeamId(null, [])).toBeNull()
  })
})

describe('parseTeamsFromMatch', () => {
  it('extracts team IDs from teams array', () => {
    const match = { teams: ['Biratnagar Kings', 'Chitwan Rhinos'], name: '' }
    const ids = parseTeamsFromMatch(match, [])
    expect(ids).toContain('biratnagar-kings')
    expect(ids).toContain('chitwan-rhinos')
  })

  it('falls back to parsing the name field with "vs"', () => {
    const match = { teams: [], name: 'Karnali Yaks vs Lumbini Lions, Match 5' }
    const ids = parseTeamsFromMatch(match, [])
    expect(ids).toContain('karnali-yaks')
    expect(ids).toContain('lumbini-lions')
  })
})

/* =========================================================================
 * 3. Mapper - status classification
 * ========================================================================= */

describe('classifyMatchStatus', () => {
  it('classifies completed statuses', () => {
    expect(classifyMatchStatus('Biratnagar Kings won by 5 wickets')).toBe('completed')
    expect(classifyMatchStatus('Match tied (Super Over)')).toBe('completed')
  })

  it('classifies live statuses', () => {
    expect(classifyMatchStatus('Biratnagar Kings need 45 runs from 30 balls')).toBe('live')
    expect(classifyMatchStatus('In progress')).toBe('live')
    expect(classifyMatchStatus('Innings Break')).toBe('live')
  })

  it('classifies abandoned / cancelled', () => {
    expect(classifyMatchStatus('Match abandoned due to rain')).toBe('abandoned')
    expect(classifyMatchStatus('No result')).toBe('abandoned')
    expect(classifyMatchStatus('Match cancelled')).toBe('abandoned')
  })

  it('classifies postponed', () => {
    expect(classifyMatchStatus('Match postponed')).toBe('postponed')
  })

  it('defaults to upcoming for unrecognised strings', () => {
    expect(classifyMatchStatus('')).toBe('upcoming')
    expect(classifyMatchStatus(null)).toBe('upcoming')
    expect(classifyMatchStatus('Match not started')).toBe('upcoming')
    expect(classifyMatchStatus('Yet to begin')).toBe('upcoming')
  })
})

/* =========================================================================
 * 4. Mapper - innings mapping
 * ========================================================================= */

describe('mapInnings', () => {
  it('maps score array to innings with resolved team IDs', () => {
    const apiMatch = {
      score: [
        { r: 160, w: 6, o: 20, inning: 'Biratnagar Kings Inning 1' },
        { r: 145, w: 9, o: 19.4, inning: 'Chitwan Rhinos Inning 1' },
      ],
    }
    const innings = mapInnings(apiMatch, ['biratnagar-kings', 'chitwan-rhinos'])
    expect(innings).toHaveLength(2)
    const bk = innings.find((i) => i.teamId === 'biratnagar-kings')
    expect(bk?.runs).toBe(160)
    expect(bk?.wickets).toBe(6)
    expect(bk?.overs).toBe(20)
  })

  it('returns empty array when no scores', () => {
    expect(mapInnings({}, [])).toHaveLength(0)
    expect(mapInnings({ score: [] }, [])).toHaveLength(0)
  })
})

/* =========================================================================
 * 5. Mapper - result derivation
 * ========================================================================= */

describe('mapResult', () => {
  const teamsById = {
    'biratnagar-kings': { id: 'biratnagar-kings', name: 'Biratnagar Kings', shortName: 'BK' },
  }

  it('returns win with winner when winner name is mentioned', () => {
    const result = mapResult(
      'Biratnagar Kings won by 5 wickets',
      ['biratnagar-kings', 'chitwan-rhinos'],
      teamsById,
    )
    expect(result?.type).toBe('win')
    expect(result?.winnerTeamId).toBe('biratnagar-kings')
    expect(result?.summary).toBe('Biratnagar Kings won by 5 wickets')
  })

  it('returns tie', () => {
    const result = mapResult('Match tied', ['biratnagar-kings', 'chitwan-rhinos'], teamsById)
    expect(result?.type).toBe('tie')
    expect(result?.winnerTeamId).toBeNull()
  })

  it('returns no-result for abandonment', () => {
    const result = mapResult('No result', ['biratnagar-kings', 'chitwan-rhinos'], teamsById)
    expect(result?.type).toBe('no-result')
  })

  it('returns null for non-completed status', () => {
    const result = mapResult('In progress', ['biratnagar-kings', 'chitwan-rhinos'], teamsById)
    expect(result).toBeNull()
  })
})

/* =========================================================================
 * 6. Mapper - overlayFromApiMatch
 * ========================================================================= */

describe('overlayFromApiMatch', () => {
  const local = {
    id: 'npl-2026-m1',
    homeTeamId: 'biratnagar-kings',
    awayTeamId: 'chitwan-rhinos',
    startTime: '2026-10-27T12:30:00+05:45',
    stage: 'league',
  }

  // teams array is required so mapResult can resolve the winner name to an ID
  const teams = [
    { id: 'biratnagar-kings', name: 'Biratnagar Kings', shortName: 'BK' },
    { id: 'chitwan-rhinos', name: 'Chitwan Rhinos', shortName: 'CR' },
  ]

  it('builds an overlay from a completed api match', () => {
    const apiMatch = {
      id: 'api-match-1',
      name: 'Biratnagar Kings vs Chitwan Rhinos, Match 2',
      status: 'Biratnagar Kings won by 5 wickets',
      teams: ['Biratnagar Kings', 'Chitwan Rhinos'],
      score: [
        { r: 160, w: 6, o: 20, inning: 'Biratnagar Kings Inning 1' },
        { r: 155, w: 9, o: 20, inning: 'Chitwan Rhinos Inning 1' },
      ],
      venue: 'TU Ground, Kirtipur',
      dateTimeGMT: '2026-10-27T06:45:00',
      fantasyEnabled: false,
    }
    const overlay = overlayFromApiMatch(apiMatch, local, teams)
    expect(overlay?.matchId).toBe('npl-2026-m1')
    expect(overlay?.status).toBe('completed')
    expect(overlay?.providerMatchId).toBe('api-match-1')
    expect(overlay?.innings).toHaveLength(2)
    expect(overlay?.result?.type).toBe('win')
    expect(overlay?.result?.winnerTeamId).toBe('biratnagar-kings')
  })

  it('returns null when local match cannot be found', () => {
    const apiMatch = { id: 'x', name: 'Unknown vs Unknown', status: 'upcoming', teams: [], score: [] }
    expect(overlayFromApiMatch(apiMatch, null)).toBeNull()
  })
})

/* =========================================================================
 * 7. Mapper - scorecard parsing
 * ========================================================================= */

describe('mapScorecard', () => {
  const local = {
    id: 'npl-2026-m1',
    homeTeamId: 'biratnagar-kings',
    awayTeamId: 'chitwan-rhinos',
  }
  const players = [
    { id: 'p1', teamId: 'biratnagar-kings', name: 'Ram Bahadur' },
    { id: 'p2', teamId: 'chitwan-rhinos', name: 'Shyam Prasad' },
  ]

  it('maps batting and bowling rows to local player IDs', () => {
    const apiScorecard = {
      scorecard: [
        {
          battingTeam: 'Biratnagar Kings',
          batting: [{ batsman: 'Ram Bahadur', r: 55, b: 40, '4s': 4, '6s': 2, dismissal: 'c Shyam b Rohan' }],
          bowling: [{ bowler: 'Shyam Prasad', o: '4.0', m: 0, r: 32, w: 2 }],
        },
      ],
    }
    const result = mapScorecard(apiScorecard, local, players)
    expect(result.supported).toBe(true)
    expect(result.batting).toHaveLength(1)
    expect(result.batting[0].playerId).toBe('p1')
    expect(result.batting[0].runs).toBe(55)
    expect(result.batting[0].fours).toBe(4)
    expect(result.batting[0].sixes).toBe(2)
    expect(result.batting[0].out).toBe(true)
    expect(result.bowling).toHaveLength(1)
    expect(result.bowling[0].playerId).toBe('p2')
    expect(result.bowling[0].wickets).toBe(2)
  })

  it('returns empty arrays for missing local match', () => {
    const result = mapScorecard({}, null, players)
    expect(result.supported).toBe(false)
    expect(result.batting).toHaveLength(0)
    expect(result.bowling).toHaveLength(0)
  })

  it('handles empty scorecard gracefully', () => {
    const result = mapScorecard({ scorecard: [] }, local, players)
    expect(result.supported).toBe(false)
  })
})

/* =========================================================================
 * 8. Mapper - live window detection
 * ========================================================================= */

describe('localMatchIsInLiveWindow', () => {
  it('returns true during a match window (30 min before, 4h after)', () => {
    const now = Date.now()
    const startTime = new Date(now - 60 * 60 * 1000).toISOString()
    expect(localMatchIsInLiveWindow({ startTime, status: 'upcoming' }, now)).toBe(true)
  })

  it('returns false when match is outside window', () => {
    const now = Date.now()
    const future = new Date(now + 5 * 60 * 60 * 1000).toISOString()
    expect(localMatchIsInLiveWindow({ startTime: future, status: 'upcoming' }, now)).toBe(false)
  })

  it('returns false for completed matches', () => {
    const now = Date.now()
    const recent = new Date(now - 30 * 60 * 1000).toISOString()
    expect(localMatchIsInLiveWindow({ startTime: recent, status: 'completed' }, now)).toBe(false)
  })

  it('returns false when startTime is missing', () => {
    expect(localMatchIsInLiveWindow({ status: 'upcoming' }, Date.now())).toBe(false)
  })
})

describe('nplHasLiveWindow', () => {
  it('returns true when at least one match is in the live window', () => {
    const now = Date.now()
    const liveNow = new Date(now - 30 * 60 * 1000).toISOString()
    expect(nplHasLiveWindow([{ startTime: liveNow, status: 'upcoming' }], now)).toBe(true)
  })

  it('returns false for empty list', () => {
    expect(nplHasLiveWindow([], Date.now())).toBe(false)
  })
})

/* =========================================================================
 * Helpers for service tests
 * ========================================================================= */

function makeClient(hitCount = { n: 0 }, responses = {}) {
  return {
    async request(path) {
      hitCount.n++
      if (responses[path]) return responses[path]
      return { data: null, info: {}, status: 'success' }
    },
  }
}

function makeSvc(store, client, env = {}) {
  return createCricketdataService({
    store,
    client,
    localMatches: [],
    teams: [],
    players: [],
    env: { CRICKETDATA_API_KEY: 'test-key', CRICKETDATA_DAILY_LIMIT: '80', ...env },
  })
}

function expiredCacheRow(dataset, payload = { status: 'ok', series: null }) {
  const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  return {
    key: dataset,
    dataset,
    payload,
    fetchedAt: past,
    expiresAt: past,
    status: 'ok',
    lockUntil: null,
  }
}

function freshCacheRow(dataset, payload = { status: 'ok', series: null }) {
  const now = new Date()
  const expires = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  return {
    key: dataset,
    dataset,
    payload,
    fetchedAt: now.toISOString(),
    expiresAt: expires,
    status: 'ok',
    lockUntil: null,
  }
}

/* =========================================================================
 * 9. Service - cache hit (no API call on fresh data)
 * ========================================================================= */

describe('service cache hit', () => {
  it('does not call the provider when data is fresh in the cache', async () => {
    const hits = { n: 0 }
    const store = createMemoryStore()
    await store.setCache(DATASETS.SERIES_SEARCH, freshCacheRow(DATASETS.SERIES_SEARCH))

    const svc = makeSvc(store, makeClient(hits))
    await svc.getFeed({ allowRefresh: true })
    expect(hits.n).toBe(0)
  })
})

/* =========================================================================
 * 10. Service - cache expiry triggers exactly one refresh
 * ========================================================================= */

describe('service cache expiry', () => {
  it('calls the provider exactly once when cached data has expired', async () => {
    const hits = { n: 0 }
    const store = createMemoryStore()
    await store.setCache(DATASETS.SERIES_SEARCH, expiredCacheRow(DATASETS.SERIES_SEARCH))

    const svc = makeSvc(store, makeClient(hits, { '/series': { data: [], info: {}, status: 'success' } }))
    await svc.getFeed({ allowRefresh: true })
    expect(hits.n).toBe(1)
  })
})

describe('live-window provider cache', () => {
  it('maps a live fixture by its verified team pair and Nepal-local date when provider omits the series name', async () => {
    const now = new Date('2026-10-26T12:00:00.000Z')
    const svc = createCricketdataService({
      store: createMemoryStore(),
      client: {
        async request(path) {
          if (path === '/series') return { data: [], info: {}, status: 'success' }
          if (path === '/currentMatches') {
            return {
              data: [{
                id: 'provider-match-1',
                name: 'Lumbini Lions vs Sudurpaschim Royals',
                teams: ['Lumbini Lions', 'Sudurpaschim Royals'],
                dateTimeGMT: '2026-10-26T11:15:00Z',
                status: 'In Progress',
                score: [{ r: 65, w: 2, o: 8.3, inning: 'Lumbini Lions Inning 1' }],
              }],
              info: {}, status: 'success',
            }
          }
          return { data: null, info: {}, status: 'success' }
        },
      },
      localMatches: MATCHES,
      teams: TEAMS,
      players: [],
      now: () => now,
      env: { CRICKETDATA_API_KEY: 'test-key' },
    })

    const feed = await svc.getFeed()
    expect(feed.meta.liveFresh).toBe(true)
    expect(feed.meta.liveMatchIds).toContain('npl-2026-m1')
    expect(feed.overlay.matches[0]).toMatchObject({
      matchId: 'npl-2026-m1', status: 'live', providerMatchId: 'provider-match-1',
    })
    expect(feed.overlay.matches[0].innings[0].runs).toBe(65)
  })

  it('checks current matches during the scheduled window even when series search has no NPL entry', async () => {
    const now = new Date('2026-10-26T12:00:00.000Z')
    const calls = []
    const svc = createCricketdataService({
      store: createMemoryStore(),
      client: {
        async request(path) {
          calls.push(path)
          if (path === '/series') throw new Error('Series endpoint unavailable')
          return { data: [], info: {}, status: 'success' }
        },
      },
      localMatches: [{
        id: 'npl-2026-m1', status: 'upcoming',
        startTime: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      }],
      teams: [],
      players: [],
      now: () => now,
      env: { CRICKETDATA_API_KEY: 'test-key' },
    })

    await svc.getFeed()
    expect(calls).toContain('/currentMatches')
  })

  it('caches provider failures briefly so page polling does not burn quota on every request', async () => {
    const now = new Date('2026-10-26T12:00:00.000Z')
    const calls = []
    const store = createMemoryStore()
    const svc = createCricketdataService({
      store,
      client: {
        async request(path) {
          calls.push(path)
          throw new Error('Provider unavailable')
        },
      },
      localMatches: [{
        id: 'npl-2026-m1', status: 'upcoming',
        startTime: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      }],
      teams: [], players: [], now: () => now,
      env: { CRICKETDATA_API_KEY: 'test-key', CRICKETDATA_TTL_LIVE_MS: '60000' },
    })

    await expect(svc.refresh(DATASETS.SERIES_SEARCH)).rejects.toThrow('Provider unavailable')
    await expect(svc.refresh(DATASETS.CURRENT_MATCHES)).rejects.toThrow('Provider unavailable')
    expect((await store.getCache(DATASETS.SERIES_SEARCH))?.status).toBe('error')
    expect((await store.getCache(DATASETS.CURRENT_MATCHES))?.status).toBe('error')
    const callCount = calls.length
    await svc.getFeed()
    expect(calls).toHaveLength(callCount)
  })

  it('rechecks current matches at the live TTL during a scheduled match, even before live data appears', async () => {
    const now = new Date('2026-10-26T12:00:00.000Z')
    const fixture = {
      id: 'npl-2026-m1',
      status: 'upcoming',
      startTime: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    }
    const store = createMemoryStore()
    const svc = createCricketdataService({
      store,
      client: makeClient({ n: 0 }, {
        '/series': { data: [], info: {}, status: 'success' },
        '/currentMatches': { data: [], info: {}, status: 'success' },
      }),
      localMatches: [fixture],
      teams: [],
      players: [],
      now: () => now,
      env: { CRICKETDATA_API_KEY: 'test-key', CRICKETDATA_TTL_LIVE_MS: '60000' },
    })

    await svc.refresh(DATASETS.CURRENT_MATCHES)
    const cache = await store.getCache(DATASETS.CURRENT_MATCHES)
    expect(new Date(cache.expiresAt).getTime() - now.getTime()).toBe(60_000)
    expect(cache.payload.hasNplLive).toBe(false)
  })
})

describe('KhelNow NPL live fallback', () => {
  const now = Date.parse('2026-10-26T12:00:00Z')
  const localMatch = MATCHES[0]
  const teamA = { team_id: 9001, name: 'Lumbini Lions', scores_full: '65/1 (8.0 ov)' }
  const teamB = { team_id: 9002, name: 'Sudurpaschim Royals', scores_full: '87/10 (17.2 ov)' }
  const listing = {
    props: { pageProps: { initialMatches: [{
      matchId: '41323', enMatchId: '99950', dateStart: '2026-10-26 11:15:00', status: '3',
      teamA: { ...teamA, teamName: teamA.name }, teamB: { ...teamB, teamName: teamB.name },
      competition: { name: 'Nepal Premier League', season: '2026' },
    }] } },
  }
  const detail = {
    props: { pageProps: { data: {
      id: '41323', en_match_id: '99950',
      match_info: {
        match_id: 99950, status_str: 'Live', status_note: 'Lumbini need 23 runs', live_inning_number: 2,
        teama: teamA, teamb: teamB,
        toss: { winner: 9001, text: 'Lumbini Lions elected to bowl' },
      },
      matchInsights: [
        { innings_id: 1, score_card: { innings: [{
          number: 1, batting_team_id: 9002, scores: '87/10', scores_full: '87/10 (17.2 ov)',
          batsmen: [{ name: 'Batter One', batsman_id: 'b1', batting: 'false', runs: '30', balls_faced: '20', fours: '3', sixes: '1', dismissal: 'caught', how_out: 'caught', strike_rate: '150.00' }],
          bowlers: [{ name: 'Bowler One', bowler_id: 'w1', bowling: 'false', overs: '2', maidens: '0', runs_conceded: '18', wickets: '1', econ: '9.00' }],
        }] } },
        { innings_id: 2, score_card: { innings: [
          { number: 1, batting_team_id: 9002, scores: '87/10', scores_full: '87/10 (17.2 ov)', batsmen: [{ name: 'Batter One', batsman_id: 'b1', batting: 'false', runs: '30', balls_faced: '20', fours: '3', sixes: '1', dismissal: 'caught', how_out: 'caught', strike_rate: '150.00' }], bowlers: [{ name: 'Bowler One', bowler_id: 'w1', bowling: 'false', overs: '2', maidens: '0', runs_conceded: '18', wickets: '1', econ: '9.00' }] },
          { number: 2, batting_team_id: 9001, scores: '65/1', scores_full: '65/1 (8.0 ov)',
        batsmen: [{ name: 'Batter One', batsman_id: 'b1', batting: 'true', runs: '30', balls_faced: '20', fours: '3', sixes: '1', dismissal: '', how_out: '', strike_rate: '150.00' }],
        bowlers: [{ name: 'Bowler One', bowler_id: 'w1', bowling: 'true', overs: '2', maidens: '0', runs_conceded: '18', wickets: '1', econ: '9.00' }],
          },
        ] }, commentary: [{ event_id: 'ball-1', event: 'ball', over: '8', ball: '1', commentary: 'One run', run: 1, timestamp: 1793016000 }] },
      ],
    } } },
  }

  it('maps live score, innings, batting, bowling, and commentary from the scoreboard page', () => {
    const mapped = khelnowInternals.mapKhelNowMatch(detail.props.pageProps.data, localMatch, TEAMS, PLAYERS)
    expect(mapped.match).toMatchObject({ matchId: localMatch.id, status: 'live', dataSourceLabel: 'KhelNow' })
    expect(mapped.match.innings).toHaveLength(2)
    expect(mapped.match.innings[0]).toMatchObject({ teamId: 'sudurpaschim-royals', runs: 87, wickets: 10, overs: 17.2 })
    expect(mapped.match.innings[1]).toMatchObject({ teamId: 'lumbini-lions', runs: 65, wickets: 1, overs: 8 })
    expect(mapped.scorecards.batting[0]).toMatchObject({ playerName: 'Batter One', runs: 30, balls: 20 })
    expect(mapped.scorecards.bowling[0]).toMatchObject({ playerName: 'Bowler One', wickets: 1 })
    expect(mapped.match.liveDetails.commentary[0].text).toBe('One run')
  })

  it('discovers the NPL match ID from the live list and fetches its detail page', async () => {
    const urls = []
    const result = await fetchKhelNowNplLive({
      localMatches: MATCHES, teams: TEAMS, players: PLAYERS, now,
      fetchImpl: async (url) => {
        urls.push(String(url))
        const body = String(url).includes('/cricket/live-score') ? listing : detail
        return { ok: true, status: 200, async text() { return `<script>${JSON.stringify(body)}</script>` } }
      },
    })
    expect(urls).toHaveLength(2)
    expect(urls[1]).toContain('/match-41323')
    expect(result.matches[0]).toMatchObject({ matchId: localMatch.id, status: 'live' })
  })

  it('adds the fallback scorecard to the normal public feed during the match window', async () => {
    const store = createMemoryStore()
    const svc = createCricketdataService({
      store,
      client: { async request(path) { return { data: path === '/series' ? [] : [], info: {}, status: 'success' } } },
      localMatches: MATCHES, teams: TEAMS, players: PLAYERS, now: () => new Date(now),
      env: { CRICKETDATA_API_KEY: 'test-key' }, khelnowEnabled: true,
      khelnowFetchImpl: async (url) => {
        const body = String(url).includes('/cricket/live-score') ? listing : detail
        return { ok: true, status: 200, async text() { return `<script>${JSON.stringify(body)}</script>` } }
      },
    })
    const feed = await svc.getFeed()
    expect(feed.meta.liveFresh).toBe(true)
    expect(feed.meta.liveMatchIds).toContain(localMatch.id)
    expect(feed.overlay.matches[0]).toMatchObject({ matchId: localMatch.id, status: 'live', dataSourceLabel: 'KhelNow' })
    expect(feed.overlay.scorecards.batting[0].playerName).toBe('Batter One')
  })
})

/* =========================================================================
 * 11. Service - 100 concurrent visitors trigger at most 1 API request
 * ========================================================================= */

describe('single-flight deduplication', () => {
  it('100 simultaneous getFeed() calls trigger at most one API request', async () => {
    const hits = { n: 0 }
    const store = createMemoryStore()
    await store.setCache(DATASETS.SERIES_SEARCH, expiredCacheRow(DATASETS.SERIES_SEARCH))

    const svc = makeSvc(store, makeClient(hits, { '/series': { data: [], info: {}, status: 'success' } }))

    await Promise.all(Array.from({ length: 100 }, () => svc.getFeed({ allowRefresh: true })))

    // singleFlight + tryLock ensures only one real network call
    expect(hits.n).toBeLessThanOrEqual(1)
  })
})

/* =========================================================================
 * 12. Quota - stops at internal limit of 80
 * ========================================================================= */

describe('quota enforcement', () => {
  it('stops automatic requests when the 80-request limit is reached', async () => {
    const hits = { n: 0 }
    const store = createMemoryStore()
    for (let i = 0; i < 80; i++) await store.consumeQuota(80)
    await store.setCache(DATASETS.SERIES_SEARCH, expiredCacheRow(DATASETS.SERIES_SEARCH))

    const svc = makeSvc(store, makeClient(hits))
    await svc.getFeed({ allowRefresh: true })
    expect(hits.n).toBe(0)
  })

  it('reports exhausted=true and remaining=0 in quotaSnapshot', async () => {
    const store = createMemoryStore()
    for (let i = 0; i < 80; i++) await store.consumeQuota(80)

    const svc = makeSvc(store, makeClient())
    const snap = await svc.quotaSnapshot()
    expect(snap.exhausted).toBe(true)
    expect(snap.remaining).toBe(0)
    expect(snap.requestCount).toBe(80)
    expect(snap.internalLimit).toBe(80)
  })
})

/* =========================================================================
 * 13. Service - API error falls back to stale cache without throwing
 * ========================================================================= */

describe('error fallback to stale cache', () => {
  it('returns stale cached data when provider throws, without crashing', async () => {
    const store = createMemoryStore()
    await store.setCache(
      DATASETS.SERIES_SEARCH,
      expiredCacheRow(DATASETS.SERIES_SEARCH, {
        status: 'ok',
        series: { id: 'old-id', name: 'Nepal Premier League 2026' },
        matches: [],
      }),
    )

    const failingClient = {
      async request() {
        throw new Error('Network error')
      },
    }

    const svc = makeSvc(store, failingClient)
    const feed = await svc.getFeed({ allowRefresh: true })
    expect(feed).toBeDefined()
    expect(feed.meta).toBeDefined()

    // Cached entry must survive the failure
    const cached = await store.getCache(DATASETS.SERIES_SEARCH)
    expect(cached?.payload).toBeDefined()
  })
})

/* =========================================================================
 * 14. Service - no API key configured
 * ========================================================================= */

describe('missing API key', () => {
  it('returns available=false with a helpful CRICKETDATA_API_KEY message', async () => {
    const svc = createCricketdataService({
      store: createMemoryStore(),
      useMemory: true,
      localMatches: [],
      teams: [],
      players: [],
      env: { CRICKETDATA_API_KEY: '', CRICKETDATA_DAILY_LIMIT: '80' },
    })

    const feed = await svc.getFeed({ allowRefresh: false })
    expect(feed.meta.available).toBe(false)
    expect(feed.meta.message).toMatch(/CRICKETDATA_API_KEY/i)
  })
})

/* =========================================================================
 * 15. API key never reaches browser
 * ========================================================================= */

describe('API key browser exposure', () => {
  it('feed.js browser module does not export any server secrets', async () => {
    const feedModule = await import('./cricketdata/feed.js')

    // Required public exports
    expect(typeof feedModule.fetchCricketdataFeed).toBe('function')
    expect(typeof feedModule.emptyCricketdataFeed).toBe('function')
    expect(typeof feedModule.fetchCricketdataAdmin).toBe('function')

    // Must NOT export anything server-side
    expect(feedModule.CRICKETDATA_API_KEY).toBeUndefined()
    expect(feedModule.apiKey).toBeUndefined()
    expect(feedModule.getConfig).toBeUndefined()
    expect(feedModule.createProviderClient).toBeUndefined()
  })
})

/* =========================================================================
 * 16. Merge - admin data preserved when newer than API fetch
 * ========================================================================= */

describe('mergeMatch - admin data preservation', () => {
  const now = Date.now()
  const adminUpdatedAt = new Date(now - 5 * 60 * 1000).toISOString()
  const apiFetchedAt   = new Date(now - 10 * 60 * 1000).toISOString()

  const local = {
    id: 'npl-2026-m1',
    homeTeamId: 'biratnagar-kings',
    awayTeamId: 'chitwan-rhinos',
    status: 'completed',
    innings: [{ teamId: 'biratnagar-kings', runs: 160, wickets: 6, overs: 20 }],
    result: { type: 'win', winnerTeamId: 'biratnagar-kings', summary: 'BK won by 5 wickets' },
    updatedAt: adminUpdatedAt,
    manualOverride: false,
  }

  const overlay = {
    matchId: 'npl-2026-m1',
    status: 'completed',
    innings: [{ teamId: 'biratnagar-kings', runs: 155, wickets: 7, overs: 20 }],
    result: { type: 'win', winnerTeamId: 'chitwan-rhinos', summary: 'CR won (wrong)' },
    statusNote: 'Chitwan Rhinos won by 2 wickets',
    providerMatchId: 'api-1',
  }

  const meta = { liveFresh: false, liveMatchIds: [], fetchedAt: apiFetchedAt }

  it('preserves admin innings and result when admin entry is newer than API fetch', () => {
    const merged = mergeMatch(local, overlay, meta, now)
    expect(merged?.innings?.[0]?.runs).toBe(160)
    expect(merged?.result?.winnerTeamId).toBe('biratnagar-kings')
    expect(merged?.scoreSource).toBe('admin')
    expect(merged?.liveConfirmed).toBe(false)
  })

  it('always prefers admin data when manualOverride is true', () => {
    const merged = mergeMatch({ ...local, manualOverride: true }, overlay, meta, now)
    expect(merged?.scoreSource).toBe('admin')
  })
})

/* =========================================================================
 * 17. Merge - live status only shown when API data is confirmed fresh
 * ========================================================================= */

describe('mergeMatch - live status accuracy', () => {
  const now = Date.now()
  const freshAt = new Date(now - 2 * 60 * 1000).toISOString()

  const local = {
    id: 'npl-2026-m5',
    homeTeamId: 'karnali-yaks',
    awayTeamId: 'pokhara-avengers',
    status: 'upcoming',
    innings: [],
    result: null,
    updatedAt: new Date(now - 60 * 60 * 1000).toISOString(),
  }

  const overlay = {
    matchId: 'npl-2026-m5',
    status: 'live',
    innings: [{ teamId: 'karnali-yaks', runs: 80, wickets: 3, overs: 12 }],
    result: null,
    statusNote: 'Karnali Yaks need 55 runs from 42 balls',
    providerMatchId: 'api-5',
  }

  it('promotes status to live only when meta.liveFresh and matchId in liveMatchIds', () => {
    const meta = { liveFresh: true, liveMatchIds: ['npl-2026-m5'], fetchedAt: freshAt }
    const merged = mergeMatch(local, overlay, meta, now)
    expect(merged?.status).toBe('live')
    expect(merged?.liveConfirmed).toBe(true)
    expect(merged?.scoreSource).toBe('api-live')
  })

  it('does NOT show live when meta.liveFresh is false (prevents stale live label)', () => {
    const staleMeta = { liveFresh: false, liveMatchIds: [], fetchedAt: freshAt }
    const merged = mergeMatch(local, overlay, staleMeta, now)
    expect(merged?.status).not.toBe('live')
    expect(merged?.liveConfirmed).toBe(false)
  })
})

describe('scheduled live status fallback', () => {
  it('marks an in-window fixture live without claiming that its score is verified', () => {
    const now = Date.parse('2026-10-26T13:30:00Z')
    const match = {
      id: 'npl-2026-m1', status: 'upcoming', startTime: '2026-10-26T17:00:00+05:45',
      innings: [], result: null,
    }
    expect(applyScheduledLiveStatus(match, now)).toMatchObject({
      status: 'live', statusSource: 'schedule', liveConfirmed: false,
    })
  })

  it('does not replace an admin override or a terminal result with schedule inference', () => {
    const now = Date.parse('2026-10-26T13:30:00Z')
    const scheduled = { status: 'upcoming', startTime: '2026-10-26T17:00:00+05:45' }
    expect(applyScheduledLiveStatus({ ...scheduled, manualOverride: true }, now).status).toBe('upcoming')
    expect(applyScheduledLiveStatus({ ...scheduled, status: 'completed' }, now).status).toBe('completed')
  })

  it('keeps a fixture upcoming before the live grace window and marks it live within that window', () => {
    const start = Date.parse('2026-10-26T17:00:00+05:45')
    const match = { status: 'upcoming', startTime: '2026-10-26T17:00:00+05:45' }
    expect(applyScheduledLiveStatus(match, start - 20 * 60_000 - 1).status).toBe('upcoming')
    expect(applyScheduledLiveStatus(match, start - 20 * 60_000).status).toBe('live')
  })
})

/* =========================================================================
 * 18. isLiveFresh helper
 * ========================================================================= */

describe('isLiveFresh', () => {
  it('returns true when meta.liveFresh and matchId is in liveMatchIds', () => {
    const overlay = { matchId: 'npl-2026-m1', status: 'live' }
    const meta = { liveFresh: true, liveMatchIds: ['npl-2026-m1'] }
    expect(isLiveFresh(overlay, meta)).toBe(true)
  })

  it('returns false when match is not in liveMatchIds', () => {
    const overlay = { matchId: 'npl-2026-m99', status: 'live' }
    const meta = { liveFresh: true, liveMatchIds: ['npl-2026-m1'] }
    expect(isLiveFresh(overlay, meta)).toBe(false)
  })

  it('returns false when meta.liveFresh is false', () => {
    const overlay = { matchId: 'npl-2026-m1', status: 'live' }
    const meta = { liveFresh: false, liveMatchIds: ['npl-2026-m1'] }
    expect(isLiveFresh(overlay, meta)).toBe(false)
  })

  it('returns false when overlay status is not live', () => {
    const overlay = { matchId: 'npl-2026-m1', status: 'completed' }
    const meta = { liveFresh: true, liveMatchIds: ['npl-2026-m1'] }
    expect(isLiveFresh(overlay, meta)).toBe(false)
  })

  it('returns false for null overlay', () => {
    expect(isLiveFresh(null, { liveFresh: true, liveMatchIds: ['x'] })).toBe(false)
  })
})

/* =========================================================================
 * 19. mergeScorecards - locked (admin) matches not overwritten
 * ========================================================================= */

describe('mergeScorecards', () => {
  const localCards = {
    batting: [{ matchId: 'npl-2026-m1', playerId: 'p1', runs: 60, source: 'admin' }],
    bowling: [],
    fielding: [],
  }
  const overlayCards = {
    batting: [{ matchId: 'npl-2026-m1', playerId: 'p1', runs: 45, source: 'cricketdata' }],
    bowling: [],
    fielding: [],
  }

  it('preserves admin batting when match has manualOverride', () => {
    const matches = [{ id: 'npl-2026-m1', manualOverride: true, scoreSource: 'admin' }]
    const merged = mergeScorecards(localCards, overlayCards, matches)
    const row = merged.batting.find((r) => r.matchId === 'npl-2026-m1' && r.playerId === 'p1')
    expect(row?.runs).toBe(60)
    expect(row?.source).toBe('admin')
  })

  it('uses API data when match is not locked', () => {
    const matches = [{ id: 'npl-2026-m1', manualOverride: false, scoreSource: 'api-cached' }]
    const merged = mergeScorecards(localCards, overlayCards, matches)
    const row = merged.batting.find((r) => r.matchId === 'npl-2026-m1' && r.playerId === 'p1')
    expect(row?.runs).toBe(45)
  })
})

/* =========================================================================
 * 20. normalizeName
 * ========================================================================= */

describe('normalizeName', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeName('Nepal')).toBe('nepal')
    expect(normalizeName('KIRTIPUR')).toBe('kirtipur')
  })

  it('replaces & with "and"', () => {
    expect(normalizeName('T&T')).toBe('t and t')
  })

  it('collapses non-alphanumeric runs to a single space', () => {
    expect(normalizeName('Biratnagar  Kings!')).toBe('biratnagar kings')
  })

  it('handles null / undefined gracefully', () => {
    expect(normalizeName(null)).toBe('')
    expect(normalizeName(undefined)).toBe('')
  })
})

/* =========================================================================
 * 21. matchLocalFixture - date and team based matching
 * ========================================================================= */

describe('matchLocalFixture', () => {
  const teams = [{ id: 'biratnagar-kings', name: 'Biratnagar Kings' }]
  const localMatches = [
    {
      id: 'npl-2026-m2',
      homeTeamId: 'biratnagar-kings',
      awayTeamId: 'chitwan-rhinos',
      startTime: '2026-10-27T12:30:00+05:45',
      stage: 'league',
    },
  ]

  it('matches by date and team pair', () => {
    const apiMatch = {
      teams: ['Biratnagar Kings', 'Chitwan Rhinos'],
      date: '2026-10-27',
      name: 'Biratnagar Kings vs Chitwan Rhinos',
    }
    const { local } = matchLocalFixture(apiMatch, localMatches, teams)
    expect(local?.id).toBe('npl-2026-m2')
  })

  it('returns null local when no fixture matches', () => {
    const apiMatch = {
      teams: ['Mumbai Indians', 'Delhi Capitals'],
      date: '2026-10-27',
      name: 'MI vs DC',
    }
    const { local } = matchLocalFixture(apiMatch, localMatches, teams)
    expect(local).toBeNull()
  })
})
