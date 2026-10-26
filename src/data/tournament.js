/**
 * Tournament-level data for NPL Fan Zone.
 *
 * Season 3 facts verified on 23 October 2026. Historical records are through
 * the end of the completed 2025 season; Season 3 starts on 26 October 2026.
 */

export const TOURNAMENT = {
  id: 'npl-2026',
  name: 'Nepal Premier League 2026',
  shortName: 'NPL 2026',
  season: 3,
  startDate: '2026-10-26',
  endDate: '2026-11-21',
  timezone: 'Asia/Kathmandu',
  timezoneLabel: 'NPT (UTC+05:45)',
  organiser: 'Cricket Association of Nepal (CAN)',
  format: 'Twenty20 — single round-robin, then four-team playoffs',
  teamCount: 8,
  matchCount: 32,
  venue: 'Tribhuvan University International Cricket Ground, Kirtipur',
  championNote: 'Lumbini Lions are the defending champions (NPL 2025).',
  source: {
    label: 'CAN NPL Season 3 schedule and start times (reported by Radio Nepal)',
    url: 'https://radionepalonline.com/en/2026/10/20/438063.html',
  },
  lastVerified: '2026-10-23',
  recordsThrough: '2025-12-13',
  seasonStatus: 'upcoming',
  seasonStatusNote: 'Season 3 is scheduled to begin on 26 October 2026. No Season 3 matches have been played yet.',
  season3T20Status: 'The ICC has granted official T20 status to Season 3 matches; this recognition applies to 2026 only.',
  season3ReviewSystem: 'The Decision Review System (DRS) will be used in every Season 3 match.',
}

/**
 * Points rules are configurable so they can be corrected if the official
 * competition regulations differ. These are the standard T20 league values
 * and are shown in the admin dashboard.
 */
export const DEFAULT_POINTS_RULES = {
  win: 2,
  tie: 1,
  noResult: 1,
  loss: 0,
  /** An all-out side is treated as having faced the full quota of overs for NRR. */
  allOutUsesFullQuota: true,
  oversPerInnings: 20,
  /** Order used when teams are level on points. */
  tieBreakers: ['nrr', 'wins', 'headToHead', 'name'],
}

export const TOURNAMENT_RULES_NOTE =
  'Points and net-run-rate rules are configurable in the admin dashboard. ' +
  'They follow standard T20 league conventions and are unverified against the ' +
  'official NPL 2026 playing conditions.'

export const VENUE = {
  name: 'Tribhuvan University International Cricket Ground',
  shortName: 'TU Cricket Ground',
  city: 'Kirtipur, Kathmandu',
  country: 'Nepal',
}
