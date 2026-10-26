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
    const response = await fetch('/api/cricketdata', { headers: { Accept: 'application/json' } })
    if (!response.ok) return EMPTY
    const json = await response.json()
    if (!json || typeof json !== 'object') return EMPTY
    return json
  } catch {
    return EMPTY
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
