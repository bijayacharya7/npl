import { isSupabaseConfigured, supabase } from '../supabase.js'

const EMPTY = {
  overlay: { matches: [], scorecards: { batting: [], bowling: [], fielding: [] }, squads: [] },
  meta: {
    provider: 'CricketData.org',
    available: false,
    coverage: 'none',
    message: 'CricketData.org feed is not available in this session.',
    fetchedAt: null,
    liveFresh: false,
    liveMatchIds: [],
  },
  capabilities: {
    fixtures: false,
    liveScores: false,
    results: false,
    scorecards: false,
    playerStats: false,
    standings: false,
    squads: false,
  },
  series: null,
}
const FEED_STORAGE_KEY = 'nplfz.last-cricketdata-feed.v1'

function storedFeed() {
  try {
    const raw = sessionStorage.getItem(FEED_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.feed && parsed.savedAt ? parsed : null
  } catch (error) {
    console.error('[NPL Fan Zone] Could not read cached live feed:', error)
    return null
  }
}

function rememberFeed(feed) {
  try {
    sessionStorage.setItem(FEED_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), feed }))
  } catch (error) {
    console.error('[NPL Fan Zone] Could not cache live feed:', error)
  }
}

function usableFeed(feed) {
  return Boolean(feed?.meta && Array.isArray(feed?.overlay?.matches))
}

function staleFeed() {
  const cached = storedFeed()
  if (!cached || Date.now() - cached.savedAt > 5 * 60 * 1000 || !usableFeed(cached.feed)) return null
  return {
    ...cached.feed,
    meta: {
      ...cached.feed.meta,
      liveFresh: false,
      message: 'Showing the last live update while reconnecting to the score provider.',
    },
  }
}

export function emptyCricketdataFeed() {
  return EMPTY
}

export async function cricketdataAuthHeaders() {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
  return { 'X-NPL-Demo-Admin': '1' }
}

export async function fetchCricketdataFeed() {
  try {
    const response = await fetch(`/api/cricketdata?ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return staleFeed() ?? EMPTY
    const json = await response.json()
    if (!usableFeed(json)) return staleFeed() ?? EMPTY
    rememberFeed(json)
    return json
  } catch {
    return staleFeed() ?? EMPTY
  }
}

export async function fetchCricketdataAdmin(headers = {}) {
  const response = await fetch('/api/cricketdata?view=admin', {
    headers: { Accept: 'application/json', ...headers },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(json.error || 'Could not load CricketData.org usage.')
  }
  return json
}

export async function refreshCricketdataDataset(dataset, headers = {}) {
  const response = await fetch('/api/cricketdata', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ dataset }),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(json.error || 'Refresh failed.')
  }
  return json
}
