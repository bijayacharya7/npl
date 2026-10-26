/**
 * One-shot coverage probe. Reads CRICKETDATA_API_KEY from the environment.
 * Never prints the key or full request URLs.
 */
const KEY = process.env.CRICKETDATA_API_KEY
if (!KEY) {
  console.error('CRICKETDATA_API_KEY is not set')
  process.exit(1)
}

const BASE = 'https://api.cricapi.com/v1'

function redact(value) {
  if (typeof value !== 'string') return value
  return value.includes(KEY) ? '[redacted]' : value
}

async function get(path, params = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apikey', KEY)
  url.searchParams.set('offset', '0')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const started = Date.now()
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  const json = await res.json().catch(() => ({}))
  return {
    path,
    http: res.status,
    ms: Date.now() - started,
    status: json.status,
    reason: json.reason ?? null,
    hitsToday: json.info?.hitsToday ?? null,
    hitsLimit: json.info?.hitsLimit ?? null,
    totalRows: json.info?.totalRows ?? null,
    data: json.data,
  }
}

function seriesSummary(row) {
  return {
    id: row?.id,
    name: row?.name,
    startDate: row?.startDate,
    endDate: row?.endDate,
    matches: row?.matches,
    squads: row?.squads,
    t20: row?.t20,
  }
}

const searches = ['Nepal Premier', 'NPL', 'Nepal Premier League']
const results = { searches: {} }

for (const search of searches) {
  const res = await get('/series', { search })
  results.searches[search] = {
    http: res.http,
    status: res.status,
    reason: redact(res.reason),
    hitsToday: res.hitsToday,
    hitsLimit: res.hitsLimit,
    totalRows: res.totalRows,
    series: Array.isArray(res.data) ? res.data.map(seriesSummary) : [],
  }
}

const allSeries = Object.values(results.searches).flatMap((s) => s.series)
const npl2026 = allSeries.find((s) => /nepal premier/i.test(s.name ?? '') && /2026/.test(s.name ?? ''))
const nplAny = allSeries.filter((s) => /nepal premier|\bnpl\b/i.test(s.name ?? ''))
results.npl2026 = npl2026 ?? null
results.nplLike = nplAny

if (npl2026?.id) {
  const info = await get('/series_info', { id: npl2026.id })
  const matchList = info.data?.matchList ?? []
  results.seriesInfo = {
    http: info.http,
    status: info.status,
    reason: redact(info.reason),
    hitsToday: info.hitsToday,
    seriesName: info.data?.info?.name,
    matchCount: matchList.length,
    squadCount: info.data?.squadList?.length ?? 0,
    sampleMatches: matchList.slice(0, 3).map((m) => ({
      name: m.name,
      status: m.status,
      date: m.date,
      teams: m.teams,
      fantasyEnabled: m.fantasyEnabled,
      hasScore: Array.isArray(m.score) && m.score.length > 0,
    })),
  }
}

const current = await get('/currentMatches')
const currentList = Array.isArray(current.data) ? current.data : []
const nplCurrent = currentList.filter(
  (m) =>
    /nepal premier|\bnpl\b/i.test(m.name ?? '') ||
    /nepal premier|\bnpl\b/i.test(m.series_id ?? '') ||
    (npl2026 && m.series_id === npl2026.id),
)
results.currentMatches = {
  http: current.http,
  status: current.status,
  reason: redact(current.reason),
  hitsToday: current.hitsToday,
  hitsLimit: current.hitsLimit,
  total: currentList.length,
  nplMatches: nplCurrent.map((m) => ({
    name: m.name,
    status: m.status,
    date: m.date,
    teams: m.teams,
  })),
}

console.log(JSON.stringify(results, null, 2))
