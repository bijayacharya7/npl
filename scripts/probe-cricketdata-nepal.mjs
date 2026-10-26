const KEY = process.env.CRICKETDATA_API_KEY
if (!KEY) {
  console.error('CRICKETDATA_API_KEY is not set')
  process.exit(1)
}

async function get(path, params = {}) {
  const url = new URL(`https://api.cricapi.com/v1${path}`)
  url.searchParams.set('apikey', KEY)
  url.searchParams.set('offset', params.offset ?? '0')
  for (const [k, v] of Object.entries(params)) {
    if (k === 'offset') continue
    url.searchParams.set(k, v)
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  const json = await res.json().catch(() => ({}))
  return json
}

const nepal = await get('/series', { search: 'Nepal' })
const names = Array.isArray(nepal.data) ? nepal.data.map((s) => s.name) : []
const info = nepal.info ?? {}

const matches = await get('/matches')
const nepalMatches = Array.isArray(matches.data)
  ? matches.data.filter((m) => /nepal|kirtipur|npl|lumbini|janakpur|pokhara|sudur/i.test(JSON.stringify(m)))
  : []

console.log(
  JSON.stringify(
    {
      nepalSeries: {
        status: nepal.status,
        reason: nepal.reason ?? null,
        hitsToday: info.hitsToday,
        hitsLimit: info.hitsLimit,
        totalRows: info.totalRows,
        names,
      },
      matchesList: {
        status: matches.status,
        hitsToday: matches.info?.hitsToday,
        totalRows: matches.info?.totalRows,
        sample: Array.isArray(matches.data)
          ? matches.data.slice(0, 5).map((m) => ({ name: m.name, date: m.date, status: m.status }))
          : [],
        nepalLikeCount: nepalMatches.length,
        nepalLike: nepalMatches.slice(0, 8).map((m) => ({
          name: m.name,
          date: m.date,
          status: m.status,
          teams: m.teams,
          series_id: m.series_id,
        })),
      },
    },
    null,
    2,
  ),
)
