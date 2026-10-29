/**
 * NPL 2026 fixtures — all 32 matches (28 league + 4 playoffs).
 *
 * Source: 2026 Nepal Premier League schedule announced by CAN and reported by Radio Nepal.
 * All matches at TU International Cricket Ground,
 * Kirtipur. Times are Nepal Standard Time (UTC+05:45).
 *
 * IMPORTANT: no results, scores or toss information are invented here. Every
 * match starts as `upcoming`. Results are entered through the admin dashboard.
 * Evening start times follow the revised 20 October 2026 schedule (17:00 NPT).
 */

import { VENUE } from './tournament.js'

const SOURCE = {
  label: 'CAN NPL Season 3 schedule and start times (reported by Radio Nepal)',
  url: 'https://radionepalonline.com/en/2026/10/20/438063.html',
}

const VENUE_NAME = `${VENUE.name}, ${VENUE.city}`

function match({ no, stage = 'league', date, time, home, away, homeLabel, awayLabel, note }) {
  return {
    id: `npl-2026-m${no}`,
    matchNo: no,
    stage,
    homeTeamId: home ?? null,
    awayTeamId: away ?? null,
    homeLabel: homeLabel ?? null,
    awayLabel: awayLabel ?? null,
    startTime: `${date}T${time}:00+05:45`,
    timezone: 'Asia/Kathmandu',
    venue: VENUE_NAME,
    status: 'upcoming',
    statusNote: note ?? null,
    toss: null,
    innings: [],
    result: null,
    playerOfMatchId: null,
    summary: null,
    source: SOURCE,
    updatedAt: '2026-10-22T00:00:00+05:45',
    verifiedSchedule: true,
  }
}

export const MATCHES = [
  {
    id: 'npl-2026-m1',
    matchNo: 1,
    stage: 'league',
    homeTeamId: 'lumbini-lions',
    awayTeamId: 'sudurpaschim-royals',
    homeLabel: null,
    awayLabel: null,
    startTime: '2026-10-26T17:00:00+05:45',
    timezone: 'Asia/Kathmandu',
    venue: VENUE_NAME,
    status: 'completed',
    statusNote: 'Lumbini Lions won by 7 wickets',
    toss: null,
    innings: [
      { teamId: 'sudurpaschim-royals', runs: 87, wickets: 10, overs: 17.2 },
      { teamId: 'lumbini-lions', runs: 88, wickets: 3, overs: 9.5 },
    ],
    result: { type: 'win', winnerTeamId: 'lumbini-lions', margin: '7 wickets', summary: 'Lumbini Lions won by 7 wickets' },
    playerOfMatchId: null,
    summary: null,
    source: SOURCE,
    updatedAt: '2026-10-28T15:08:18.867Z',
    verifiedSchedule: true,
  },
  {
    id: 'npl-2026-m2',
    matchNo: 2,
    stage: 'league',
    homeTeamId: 'biratnagar-kings',
    awayTeamId: 'chitwan-rhinos',
    homeLabel: null,
    awayLabel: null,
    startTime: '2026-10-27T12:30:00+05:45',
    timezone: 'Asia/Kathmandu',
    venue: VENUE_NAME,
    status: 'completed',
    statusNote: 'Chitwan Rhinos won by 8 runs',
    toss: null,
    innings: [
      { teamId: 'chitwan-rhinos', runs: 157, wickets: 3, overs: 20 },
      { teamId: 'biratnagar-kings', runs: 149, wickets: 10, overs: 19.3 },
    ],
    result: { type: 'win', winnerTeamId: 'chitwan-rhinos', margin: '8 runs', summary: 'Chitwan Rhinos won by 8 runs' },
    playerOfMatchId: null,
    summary: null,
    source: SOURCE,
    updatedAt: '2026-10-28T15:08:18.867Z',
    verifiedSchedule: true,
  },
  {
    id: 'npl-2026-m3',
    matchNo: 3,
    stage: 'league',
    homeTeamId: 'karnali-yaks',
    awayTeamId: 'janakpur-bolts',
    homeLabel: null,
    awayLabel: null,
    startTime: '2026-10-27T17:00:00+05:45',
    timezone: 'Asia/Kathmandu',
    venue: VENUE_NAME,
    status: 'completed',
    statusNote: 'Karnali Yaks won by 19 runs',
    toss: null,
    innings: [
      { teamId: 'karnali-yaks', runs: 132, wickets: 9, overs: 20 },
      { teamId: 'janakpur-bolts', runs: 113, wickets: 10, overs: 19.3 },
    ],
    result: { type: 'win', winnerTeamId: 'karnali-yaks', margin: '19 runs', summary: 'Karnali Yaks won by 19 runs' },
    playerOfMatchId: null,
    summary: null,
    source: SOURCE,
    updatedAt: '2026-10-28T15:08:18.867Z',
    verifiedSchedule: true,
  },
  {
    id: 'npl-2026-m4',
    matchNo: 4,
    stage: 'league',
    homeTeamId: 'pokhara-avengers',
    awayTeamId: 'sudurpaschim-royals',
    homeLabel: null,
    awayLabel: null,
    startTime: '2026-10-28T17:00:00+05:45',
    timezone: 'Asia/Kathmandu',
    venue: VENUE_NAME,
    status: 'completed',
    statusNote: 'Sudurpaschim Royals won by 6 wickets',
    toss: null,
    innings: [
      { teamId: 'pokhara-avengers', runs: 145, wickets: 7, overs: 20 },
      { teamId: 'sudurpaschim-royals', runs: 148, wickets: 4, overs: 16.5 },
    ],
    result: { type: 'win', winnerTeamId: 'sudurpaschim-royals', margin: '6 wickets', summary: 'Sudurpaschim Royals won by 6 wickets' },
    playerOfMatchId: null,
    summary: null,
    source: SOURCE,
    updatedAt: '2026-10-28T15:08:18.867Z',
    verifiedSchedule: true,
  },
  match({ no: 5, date: '2026-10-29', time: '12:30', home: 'janakpur-bolts', away: 'kathmandu-gurkhas' }),
  match({ no: 6, date: '2026-10-29', time: '17:00', home: 'karnali-yaks', away: 'biratnagar-kings' }),
  match({ no: 7, date: '2026-10-31', time: '12:30', home: 'lumbini-lions', away: 'chitwan-rhinos' }),
  match({ no: 8, date: '2026-10-31', time: '17:00', home: 'sudurpaschim-royals', away: 'biratnagar-kings' }),
  match({ no: 9, date: '2026-11-01', time: '17:00', home: 'janakpur-bolts', away: 'pokhara-avengers' }),
  match({ no: 10, date: '2026-11-02', time: '12:30', home: 'kathmandu-gurkhas', away: 'karnali-yaks' }),
  match({ no: 11, date: '2026-11-02', time: '17:00', home: 'sudurpaschim-royals', away: 'chitwan-rhinos' }),
  match({ no: 12, date: '2026-11-03', time: '12:30', home: 'biratnagar-kings', away: 'janakpur-bolts' }),
  match({ no: 13, date: '2026-11-03', time: '17:00', home: 'lumbini-lions', away: 'pokhara-avengers' }),
  match({ no: 14, date: '2026-11-05', time: '12:30', home: 'lumbini-lions', away: 'janakpur-bolts' }),
  match({ no: 15, date: '2026-11-05', time: '17:00', home: 'kathmandu-gurkhas', away: 'biratnagar-kings' }),
  match({ no: 16, date: '2026-11-06', time: '12:30', home: 'sudurpaschim-royals', away: 'karnali-yaks' }),
  match({ no: 17, date: '2026-11-06', time: '17:00', home: 'chitwan-rhinos', away: 'pokhara-avengers' }),
  match({ no: 18, date: '2026-11-07', time: '17:00', home: 'kathmandu-gurkhas', away: 'lumbini-lions' }),
  match({ no: 19, date: '2026-11-09', time: '12:30', home: 'pokhara-avengers', away: 'karnali-yaks' }),
  match({ no: 20, date: '2026-11-09', time: '17:00', home: 'chitwan-rhinos', away: 'kathmandu-gurkhas' }),
  match({ no: 21, date: '2026-11-10', time: '17:00', home: 'sudurpaschim-royals', away: 'janakpur-bolts' }),
  match({ no: 22, date: '2026-11-12', time: '12:30', home: 'biratnagar-kings', away: 'pokhara-avengers' }),
  match({ no: 23, date: '2026-11-12', time: '17:00', home: 'karnali-yaks', away: 'lumbini-lions' }),
  match({ no: 24, date: '2026-11-13', time: '12:30', home: 'kathmandu-gurkhas', away: 'sudurpaschim-royals' }),
  match({ no: 25, date: '2026-11-13', time: '17:00', home: 'janakpur-bolts', away: 'chitwan-rhinos' }),
  match({ no: 26, date: '2026-11-14', time: '17:00', home: 'biratnagar-kings', away: 'lumbini-lions' }),
  match({ no: 27, date: '2026-11-15', time: '12:30', home: 'chitwan-rhinos', away: 'karnali-yaks' }),
  match({ no: 28, date: '2026-11-15', time: '17:00', home: 'pokhara-avengers', away: 'kathmandu-gurkhas' }),
  match({
    no: 29,
    stage: 'qualifier1',
    date: '2026-11-17',
    time: '17:00',
    homeLabel: 'League 1st place',
    awayLabel: 'League 2nd place',
    note: '5:00 PM NPT start follows the revised 20 October 2026 schedule. Teams are decided by the final league table.',
  }),
  match({
    no: 30,
    stage: 'eliminator',
    date: '2026-11-18',
    time: '17:00',
    homeLabel: 'League 3rd place',
    awayLabel: 'League 4th place',
    note: 'Teams are decided by the final league table.',
  }),
  match({
    no: 31,
    stage: 'qualifier2',
    date: '2026-11-19',
    time: '17:00',
    homeLabel: 'Loser of Qualifier 1',
    awayLabel: 'Winner of Eliminator',
    note: 'Teams are decided by the playoff results.',
  }),
  match({
    no: 32,
    stage: 'final',
    date: '2026-11-21',
    time: '17:00',
    homeLabel: 'Winner of Qualifier 1',
    awayLabel: 'Winner of Qualifier 2',
    note: 'Teams are decided by the playoff results.',
  }),
]

export const STAGE_LABELS = {
  league: 'League stage',
  qualifier1: 'Qualifier 1',
  eliminator: 'Eliminator',
  qualifier2: 'Qualifier 2',
  final: 'Final',
}

export const MATCH_STATUSES = ['upcoming', 'live', 'completed', 'postponed', 'abandoned']

export const STATUS_LABELS = {
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
  postponed: 'Postponed',
  abandoned: 'Abandoned',
}

export const MATCH_BY_ID = Object.fromEntries(MATCHES.map((m) => [m.id, m]))

export function getMatch(id) {
  return MATCH_BY_ID[id] ?? null
}

export function matchesForTeam(teamId, allMatches = MATCHES) {
  return allMatches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
}
