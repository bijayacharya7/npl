/** Server-only cricket data provider settings. Never import from React pages. */

export const PROVIDER = {
  name: 'CricketData.org',
  baseUrl: 'https://api.cricapi.com/v1',
  docsUrl: 'https://cricketdata.org/how-to-use-cricket-data-api.aspx',
  // OpenAPI documents hitsToday / hitsLimit but not a reset timezone. CricAPI
  // historically resets the daily counter at midnight UTC, so we follow UTC.
  quotaResetTimezone: 'UTC',
}

export const DATASETS = {
  SERIES_SEARCH: 'series_search',
  SERIES_INFO: 'series_info',
  CURRENT_MATCHES: 'current_matches',
  MATCH_INFO: 'match_info',
  MATCH_SCORECARD: 'match_scorecard',
  SERIES_SQUADS: 'series_squads',
  FEED: 'npl_feed',
}

const hour = 60 * 60 * 1000
const minute = 60 * 1000

function envNumber(env, name, fallback) {
  const raw = env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function getConfig(env = process.env) {
  return {
    apiKey: String(env.CRICKETDATA_API_KEY ?? '').trim(),
    cricbuzzApiKey: String(env.CRICBUZZ_RAPIDAPI_KEY ?? env.RAPIDAPI_KEY ?? '').trim(),
    // Conservative default; increase only to the purchased provider allowance.
    dailyLimit: envNumber(env, 'CRICKETDATA_DAILY_LIMIT', 80),
    providerLimit: envNumber(env, 'CRICKETDATA_PROVIDER_LIMIT', 100),
    ttl: {
      teams: envNumber(env, 'CRICKETDATA_TTL_TEAMS_MS', 24 * hour),
      fixtures: envNumber(env, 'CRICKETDATA_TTL_FIXTURES_MS', 6 * hour),
      results: envNumber(env, 'CRICKETDATA_TTL_RESULTS_MS', 12 * hour),
      playerStats: envNumber(env, 'CRICKETDATA_TTL_STATS_MS', 12 * hour),
      points: envNumber(env, 'CRICKETDATA_TTL_POINTS_MS', 60 * minute),
      live: envNumber(env, 'CRICKETDATA_TTL_LIVE_MS', 30 * 1000),
      seriesSearch: envNumber(env, 'CRICKETDATA_TTL_SEARCH_MS', 24 * hour),
    },
    requestTimeoutMs: envNumber(env, 'CRICKETDATA_TIMEOUT_MS', 12000),
    lockMs: envNumber(env, 'CRICKETDATA_LOCK_MS', 45 * 1000),
    supabaseUrl: String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim(),
    supabaseServiceKey: String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    cronSecret: String(env.CRON_SECRET || '').trim(),
    allowDemoAdmin: env.NODE_ENV !== 'production',
    cacheFile: String(env.CRICKETDATA_CACHE_FILE || '.data/cricketdata-cache.json'),
  }
}

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function msUntilUtcMidnight(date = new Date()) {
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
  return Math.max(0, next - date.getTime())
}
