import { MATCHES } from '../../data/matches.js'
import { TEAMS } from '../../data/teams.js'
import { PLAYERS } from '../../data/players.js'
import { DATASETS, getConfig, msUntilUtcMidnight, PROVIDER } from './config.js'
import { createProviderClient } from './client.js'
import { fetchCricbuzzNplLive } from './cricbuzz.js'
import { fetchKhelNowNplLive } from './khelnow.js'
import {
  isNpl2026SeriesName,
  localMatchIsInLiveWindow,
  mapScorecard,
  matchLocalFixture,
  nplHasLiveWindow,
  overlayFromApiMatch,
  pickNpl2026Series,
} from './mapper.js'
import { createMemoryStore, createStore } from './store.js'

const inflight = new Map()
const minute = 60 * 1000
const LIVE_SCORECARD_TTL_MS = 30 * 1000
const CRICBUZZ_CACHE_KEY = 'cricbuzz_npl_live'
const CRICBUZZ_CACHE_MS = 30 * 1000
const KHELNOW_CACHE_KEY = 'khelnow_npl_matches'
const KHELNOW_CACHE_MS = 5 * minute
const KHELNOW_LIVE_CACHE_MS = 30 * 1000

function nplSeasonIsActive(matches, now) {
  const starts = matches.map((match) => new Date(match.startTime).getTime()).filter(Number.isFinite)
  if (!starts.length) return false
  return now >= Math.min(...starts) - 24 * 60 * minute && now <= Math.max(...starts) + 24 * 60 * minute
}

function emptyFeed(partial = {}) {
  return {
    overlay: { matches: [], scorecards: { batting: [], bowling: [], fielding: [] }, squads: [] },
    meta: {
      provider: 'Sportmonks Cricket API',
      available: false,
      coverage: 'none',
      message: 'Live scores are not connected. Configure SPORTMONKS_API_TOKEN on the server to enable authorized NPL live updates.',
      fetchedAt: null,
      expiresAt: null,
      liveFresh: false,
      liveMatchIds: [],
      lastUpdatedLabel: null,
      quota: null,
      ...partial.meta,
    },
    capabilities: {
      fixtures: false,
      liveScores: false,
      results: false,
      scorecards: false,
      playerStats: false,
      standings: false,
      squads: false,
      ...partial.capabilities,
    },
    series: null,
    ...partial,
  }
}

function apiMatchDateInNplTimezone(apiMatch) {
  const dateOnly = String(apiMatch?.date ?? '')
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly
  const timestamp = apiMatch?.dateTimeGMT ?? apiMatch?.date
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

async function singleFlight(key, fn) {
  if (inflight.has(key)) return inflight.get(key)
  const job = Promise.resolve()
    .then(fn)
    .finally(() => inflight.delete(key))
  inflight.set(key, job)
  return job
}

export function createCricketdataService(options = {}) {
  const config = options.config ?? getConfig(options.env ?? process.env)
  const store = options.store ?? (options.useMemory ? createMemoryStore() : createStore(config))
  const localMatches = options.localMatches ?? MATCHES
  const teams = options.teams ?? TEAMS
  const players = options.players ?? PLAYERS
  const nowFn = options.now ?? (() => new Date())

  async function getCricbuzzLive() {
    if (!config.cricbuzzApiKey) return null
    const now = nowFn()
    const cached = await readCache(CRICBUZZ_CACHE_KEY)
    if (cached?.payload && cached.expiresAt && new Date(cached.expiresAt).getTime() > now.getTime()) {
      return cached.payload
    }

    return singleFlight(CRICBUZZ_CACHE_KEY, async () => {
      const payload = await fetchCricbuzzNplLive({
        apiKey: config.cricbuzzApiKey,
        localMatches,
        teams,
        players,
        fetchImpl: options.fetchImpl,
        now: now.getTime(),
      })
      await writeCache(CRICBUZZ_CACHE_KEY, DATASETS.CURRENT_MATCHES, payload, CRICBUZZ_CACHE_MS, 'ok')
      return payload
    }).catch(async (error) => {
      await store.addEvent({ dataset: DATASETS.CURRENT_MATCHES, action: 'cricbuzz-error', detail: error.message, ok: false })
      return cached?.payload ?? null
    })
  }

  async function getKhelNowMatches() {
    const enabled = options.khelnowEnabled === true ||
      (options.khelnowEnabled !== false && !options.client)
    if (!enabled) return null
    const now = nowFn()
    const cached = await readCache(KHELNOW_CACHE_KEY)
    if (cached?.payload && cached.expiresAt && new Date(cached.expiresAt).getTime() > now.getTime()) {
      return cached.payload
    }
    return singleFlight(KHELNOW_CACHE_KEY, async () => {
      const payload = await fetchKhelNowNplLive({
        localMatches,
        teams,
        players,
        previousPayload: cached?.payload ?? null,
        now: now.getTime(),
        fetchImpl: options.khelnowFetchImpl ?? options.fetchImpl,
        fetchAll: true,
      })
      const hasLiveMatch = payload?.matches?.some((match) => match.status === 'live')
      const ttl = hasLiveMatch ? KHELNOW_LIVE_CACHE_MS : KHELNOW_CACHE_MS
      await writeCache(KHELNOW_CACHE_KEY, DATASETS.CURRENT_MATCHES, payload, ttl, 'ok')
      return payload
    }).catch(async (error) => {
      await store.addEvent({ dataset: DATASETS.CURRENT_MATCHES, action: 'khelnow-error', detail: error.message, ok: false })
      return cached?.payload ?? null
    })
  }

  const onQuotaInfo = async (info) => {
    const current = await store.getQuota(nowFn())
    await store.updateQuota(
      {
        requestCount: current.requestCount,
        providerHitsToday: info.hitsToday ?? current.providerHitsToday,
        providerHitsLimit: info.hitsLimit ?? current.providerHitsLimit ?? config.providerLimit,
        lastError: current.lastError,
        rateLimitedAt: current.rateLimitedAt,
        lastRequestAt: nowFn().toISOString(),
      },
      nowFn(),
    )
  }

  const client = options.client ??
    createProviderClient({
      apiKey: config.apiKey,
      timeoutMs: config.requestTimeoutMs,
      fetchImpl: options.fetchImpl,
      dailyLimit: config.dailyLimit,
      onQuotaInfo,
      consumeQuota: async () => {
        const current = await store.getQuota(nowFn())
        if ((current.providerHitsToday ?? 0) >= config.dailyLimit) {
          return { allowed: false, requestCount: current.requestCount, day: current.day }
        }
        return store.consumeQuota(config.dailyLimit, nowFn())
      },
    })

  async function quotaSnapshot() {
    const quota = await store.getQuota(nowFn())
    const remaining = Math.max(0, config.dailyLimit - (quota.requestCount ?? 0))
    const providerRemaining = Math.max(0, (quota.providerHitsLimit ?? config.providerLimit) - (quota.providerHitsToday ?? quota.requestCount ?? 0))
    return {
      ...quota,
      internalLimit: config.dailyLimit,
      remaining,
      providerRemaining,
      resetsInMs: msUntilUtcMidnight(nowFn()),
      resetTimezone: PROVIDER.quotaResetTimezone,
      exhausted: remaining <= 0 || (quota.providerHitsToday ?? 0) >= config.dailyLimit,
    }
  }

  async function readCache(key) {
    return store.getCache(key)
  }

  function isFresh(row, now) {
    if (!row?.expiresAt || row.status === 'empty') return false
    if (row.status === 'error' || row.status === 'stale-error') {
      return new Date(row.expiresAt).getTime() > now.getTime()
    }
    return Boolean(row.payload) && new Date(row.expiresAt).getTime() > now.getTime()
  }

  async function writeCache(key, dataset, payload, ttlMs, status = 'ok', extra = {}) {
    const now = nowFn()
    return store.setCache(key, {
      key,
      dataset,
      payload,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      status,
      lockUntil: null,
      ...extra,
    })
  }

  async function refreshDataset(dataset, { force = false, source = 'auto' } = {}) {
    return singleFlight(dataset, async () => {
      const now = nowFn()
      const cached = await readCache(dataset)
      if (!force && isFresh(cached, now)) {
        return { cache: cached, refreshed: false, reason: 'fresh' }
      }

      const locked = await store.tryLock(dataset, config.lockMs, now)
      if (!locked) {
        return { cache: cached, refreshed: false, reason: 'locked' }
      }

      try {
        const quota = await quotaSnapshot()
        if (quota.exhausted && source !== 'manual') {
          await store.addEvent({ dataset, action: 'skip', detail: 'Internal daily budget exhausted', ok: true })
          return { cache: cached, refreshed: false, reason: 'quota' }
        }
        if (quota.exhausted && source === 'manual') {
          const error = new Error('Refreshing now would exceed the remaining CricketData.org budget.')
          error.code = 'QUOTA'
          error.quota = quota
          throw error
        }

        const payload = await loadDataset(dataset, cached)
        const ttl = ttlFor(dataset, payload)
        const saved = await writeCache(dataset, dataset, payload, ttl, payload?.status ?? 'ok')
        const quotaState = await store.getQuota(nowFn())
        await store.updateQuota({ ...quotaState, lastError: null }, nowFn())
        await store.addEvent({ dataset, action: 'refresh', detail: `${source} refresh ok`, ok: true })
        return { cache: saved, refreshed: true, reason: 'fetched' }
      } catch (error) {
        await store.unlock(dataset)
        const current = await store.getQuota(nowFn())
        await store.updateQuota(
          {
            requestCount: current.requestCount,
            providerHitsToday: current.providerHitsToday,
            providerHitsLimit: current.providerHitsLimit,
            lastError: error.message,
            rateLimitedAt: error.code === 'RATE_LIMIT' ? nowFn().toISOString() : current.rateLimitedAt,
            lastRequestAt: current.lastRequestAt,
          },
          nowFn(),
        )
        await store.addEvent({ dataset, action: 'error', detail: error.message, ok: false })
        const failedAt = nowFn()
        const retryDelay = Math.min(config.ttl.live, 5 * minute)
        await store.setCache(dataset, {
          key: dataset,
          dataset,
          payload: cached?.payload ?? null,
          fetchedAt: cached?.fetchedAt ?? null,
          expiresAt: new Date(failedAt.getTime() + retryDelay).toISOString(),
          status: cached?.payload ? 'stale-error' : 'error',
          error: error.message,
          lockUntil: null,
        })
        if (cached?.payload) {
          return { cache: cached, refreshed: false, reason: 'error-stale', error }
        }
        throw error
      }
    })
  }

  function ttlFor(dataset, payload) {
    if (dataset === DATASETS.SERIES_SEARCH) return config.ttl.seriesSearch
    if (dataset === DATASETS.SERIES_INFO) return payload?.hasLive ? LIVE_SCORECARD_TTL_MS : config.ttl.fixtures
    if (dataset === DATASETS.CURRENT_MATCHES) {
      const scheduledLiveWindow = nplHasLiveWindow(localMatches, nowFn().getTime())
      return payload?.hasNplLive || scheduledLiveWindow ? config.ttl.live : config.ttl.fixtures
    }
    if (dataset === DATASETS.MATCH_INFO) return config.ttl.live
    if (dataset === DATASETS.MATCH_SCORECARD) {
      const liveMatches = payload?.liveMatches ?? 0
      return liveMatches > 0 ? LIVE_SCORECARD_TTL_MS : config.ttl.playerStats
    }
    if (dataset === DATASETS.SERIES_SQUADS) return config.ttl.teams
    return config.ttl.fixtures
  }

  async function loadDataset(dataset) {
    if (dataset === DATASETS.SERIES_SEARCH) {
      const search = 'Nepal Premier League'
      const last = await client.request('/series', { search })
      const series = pickNpl2026Series(last.data)
      return {
        status: series ? 'ok' : 'unavailable',
        series,
        searchedAt: nowFn().toISOString(),
        namesTried: [search],
        sampleNames: Array.isArray(last?.data) ? last.data.slice(0, 8).map((row) => row.name) : [],
      }
    }

    if (dataset === DATASETS.SERIES_INFO) {
      const search = await ensureSearch()
      const series = search?.payload?.series
      if (!series?.id) {
        return { status: 'unavailable', series: null, matches: [], squads: [] }
      }
      const response = await client.request('/series_info', { id: series.id })
      const info = response.data?.info ?? series
      if (!isNpl2026SeriesName(info?.name ?? series.name)) {
        return { status: 'unavailable', series: null, matches: [], squads: [], rejectedName: info?.name }
      }
      const matchList = Array.isArray(response.data?.matchList) ? response.data.matchList : []
      const overlays = matchList
        .map((apiMatch) => overlayFromApiMatch(apiMatch, matchLocalFixture(apiMatch, localMatches, teams).local, teams))
        .filter(Boolean)
      return {
        status: 'ok',
        series: { id: info.id ?? series.id, name: info.name, startDate: info.startDate, endDate: info.endDate },
        matches: overlays,
        rawMatchCount: matchList.length,
        mappedCount: overlays.length,
        squads: response.data?.squadList ?? [],
        hasLive: overlays.some((row) => row.status === 'live'),
      }
    }

    if (dataset === DATASETS.CURRENT_MATCHES) {
      if (!nplHasLiveWindow(localMatches, nowFn().getTime()) && !(await hasCachedLive())) {
        return { status: 'skipped', reason: 'no-live-window', matches: [], hasNplLive: false }
      }
      // maybeAutoRefresh refreshes series search independently. Do not make
      // currentMatches depend on that endpoint: providers may expose active
      // fixtures here even when their NPL series catalogue is incomplete.
      const search = await readCache(DATASETS.SERIES_SEARCH)
      const seriesId = search?.payload?.series?.id ?? null
      const response = await client.request('/currentMatches')
      const list = Array.isArray(response.data) ? response.data : []
      const npl = list.filter((row) => {
        if (seriesId && row.series_id === seriesId) return true
        if (isNpl2026SeriesName(row.name) || /nepal premier league|\bnpl 2026\b/i.test(row.name ?? '')) return true

        // Some provider feeds expose the fixture without its series name.
        // Accept it only when both teams and the Nepal-local date match one
        // verified NPL fixture, avoiding unrelated matches for the same teams.
        const scheduled = matchLocalFixture(row, localMatches, teams).local
        return Boolean(
          scheduled &&
          String(scheduled.startTime).slice(0, 10) === apiMatchDateInNplTimezone(row),
        )
      })
      const overlays = npl
        .map((apiMatch) => overlayFromApiMatch(apiMatch, matchLocalFixture(apiMatch, localMatches, teams).local, teams))
        .filter(Boolean)
      return {
        status: 'ok',
        matches: overlays,
        hasNplLive: overlays.some((row) => row.status === 'live'),
        scanned: list.length,
        nplCount: npl.length,
      }
    }

    if (dataset === DATASETS.MATCH_SCORECARD) {
      const info = (await readCache(DATASETS.SERIES_INFO))?.payload
      const current = (await readCache(DATASETS.CURRENT_MATCHES))?.payload
      const candidates = [...(current?.matches ?? []), ...(info?.matches ?? [])].filter(
        (row) => row.providerMatchId && ['completed', 'live'].includes(row.status),
      )
      const unique = []
      const seen = new Set()
      for (const row of candidates) {
        if (seen.has(row.providerMatchId)) continue
        seen.add(row.providerMatchId)
        unique.push(row)
      }
      const completedUnfetched = unique.filter((row) => row.status === 'completed').slice(0, 1)
      // Each currently live NPL match needs its own scorecard request so a
      // double-header (or overlapping fixtures) updates for every team.
      const liveOnes = unique.filter((row) => row.status === 'live')
      const toFetch = liveOnes.length ? liveOnes : completedUnfetched
      const scorecards = { batting: [], bowling: [], fielding: [] }
      let supported = false
      for (const row of toFetch) {
        const response = await client.request('/match_scorecard', { id: row.providerMatchId })
        const local = localMatches.find((match) => match.id === row.matchId)
        const mapped = mapScorecard(response.data, local, players)
        supported = supported || mapped.supported
        scorecards.batting.push(...mapped.batting)
        scorecards.bowling.push(...mapped.bowling)
        scorecards.fielding.push(...mapped.fielding)
      }
      return {
        status: toFetch.length ? 'ok' : 'skipped',
        scorecards,
        supported,
        fetched: toFetch.length,
        liveMatches: liveOnes.length,
      }
    }

    if (dataset === DATASETS.SERIES_SQUADS) {
      const info = (await readCache(DATASETS.SERIES_INFO))?.payload
      const squads = info?.squads ?? []
      return { status: squads.length ? 'ok' : 'unavailable', squads, note: 'Series info lists squad names only.' }
    }

    throw new Error(`Unknown dataset ${dataset}`)
  }

  async function ensureSearch() {
    const result = await refreshDataset(DATASETS.SERIES_SEARCH)
    return result.cache
  }

  async function hasCachedLive() {
    const info = await readCache(DATASETS.SERIES_INFO)
    const current = await readCache(DATASETS.CURRENT_MATCHES)
    return Boolean(
      info?.payload?.hasLive ||
        current?.payload?.hasNplLive ||
        localMatches.some((match) => match.status === 'live' && localMatchIsInLiveWindow(match, nowFn().getTime())),
    )
  }

  function mergeOverlays(...lists) {
    const byId = new Map()
    for (const list of lists) {
      for (const row of list ?? []) {
        const previous = byId.get(row.matchId)
        if (!previous) {
          byId.set(row.matchId, row)
          continue
        }
        const prefer = row.status === 'live' || (row.innings?.length ?? 0) >= (previous.innings?.length ?? 0)
        byId.set(row.matchId, prefer ? { ...previous, ...row } : { ...row, ...previous })
      }
    }
    return [...byId.values()]
  }

  async function maybeAutoRefresh() {
    const now = nowFn()
    try {
      await refreshDataset(DATASETS.SERIES_SEARCH)
    } catch {
      // The independent current-match feed may still provide a live NPL game.
    }
    const search = await readCache(DATASETS.SERIES_SEARCH)
    if (search?.payload?.series) {
      try {
        await refreshDataset(DATASETS.SERIES_INFO)
      } catch {
        // Keep using cached series info and continue checking current matches.
      }
    }

    const liveWindow = nplHasLiveWindow(localMatches, now.getTime()) || (await hasCachedLive())
    if (liveWindow) {
      try {
        await refreshDataset(DATASETS.CURRENT_MATCHES)
      } catch {
        // A transient current-match failure must not suppress cached feed data.
      }
    }

    const info = (await readCache(DATASETS.SERIES_INFO))?.payload
    const current = (await readCache(DATASETS.CURRENT_MATCHES))?.payload
    const liveApi = [...(info?.matches ?? []), ...(current?.matches ?? [])].some((row) => row.status === 'live')
    const wantCards = [...(info?.matches ?? []), ...(current?.matches ?? [])].some(
      (row) => row.providerMatchId && ['completed', 'live'].includes(row.status),
    )
    if (liveApi && wantCards) {
      const cards = await readCache(DATASETS.MATCH_SCORECARD)
      // Keep live scorecards on a short TTL so a visitor poll does not reuse a
      // full match-statistics cache while play is ongoing.
      if (!isFresh(cards, now) || cards.payload?.liveMatches > 0) {
        try {
          await refreshDataset(DATASETS.MATCH_SCORECARD)
        } catch {
          // Scores remain available from the match feed when scorecards fail.
        }
      }
    } else if (wantCards) {
      const cards = await readCache(DATASETS.MATCH_SCORECARD)
      if (!isFresh(cards, now)) {
        try {
          await refreshDataset(DATASETS.MATCH_SCORECARD)
        } catch {
          // Scorecards are optional; preserve the core match feed.
        }
      }
    }
  }

  async function buildFeed(cricbuzz = null) {
    const search = (await readCache(DATASETS.SERIES_SEARCH))?.payload
    const info = (await readCache(DATASETS.SERIES_INFO))?.payload
    const current = (await readCache(DATASETS.CURRENT_MATCHES))?.payload
    const cards = (await readCache(DATASETS.MATCH_SCORECARD))?.payload
    const khelnow = await getKhelNowMatches()
    const caches = await store.listCache()
    const newest = caches
      .filter((row) => row.fetchedAt)
      .sort((a, b) => String(b.fetchedAt).localeCompare(String(a.fetchedAt)))[0]

    const overlays = mergeOverlays(info?.matches, current?.matches, khelnow?.matches, cricbuzz?.matches)
    const liveIds = overlays.filter((row) => row.status === 'live').map((row) => row.matchId)
    const currentRow = await readCache(DATASETS.CURRENT_MATCHES)
    const cricketDataLiveFresh =
      liveIds.length > 0 &&
      (currentRow?.fetchedAt || newest?.fetchedAt) &&
      nowFn().getTime() - new Date(currentRow?.fetchedAt || newest.fetchedAt).getTime() <= config.ttl.live
    const cricbuzzFresh = Boolean(
      cricbuzz?.matches?.length &&
      nowFn().getTime() - new Date(cricbuzz.fetchedAt).getTime() <= CRICBUZZ_CACHE_MS + 5_000,
    )
    const cricbuzzLiveFresh = Boolean(cricbuzzFresh && cricbuzz.matches.some((row) => row.status === 'live'))
    const khelnowLive = Boolean(khelnow?.matches?.some((row) => row.status === 'live'))
    const khelnowFresh = Boolean(
      khelnow?.fetchedAt &&
      nowFn().getTime() - new Date(khelnow.fetchedAt).getTime() <=
        (khelnowLive ? KHELNOW_LIVE_CACHE_MS : KHELNOW_CACHE_MS),
    )
    const khelnowLiveFresh = Boolean(khelnowFresh && khelnowLive)
    const liveFresh = Boolean(cricketDataLiveFresh || cricbuzzLiveFresh || khelnowLiveFresh)
    const liveMatchIds = liveFresh ? liveIds : []
    if (cricbuzzLiveFresh) {
      for (const row of cricbuzz.matches) {
        if (row.status === 'live' && !liveMatchIds.includes(row.matchId)) liveMatchIds.push(row.matchId)
      }
    }
    if (khelnowLiveFresh) {
      for (const row of khelnow.matches) {
        if (row.status === 'live' && !liveMatchIds.includes(row.matchId)) liveMatchIds.push(row.matchId)
      }
    }

    const series = info?.series ?? search?.series ?? null
    const hasCricbuzzData = Boolean(cricbuzz?.matches?.length)
    const hasKhelNowData = Boolean(khelnow?.matches?.length)
    const available = Boolean(series || hasCricbuzzData || hasKhelNowData)
    const hasMapped = overlays.length > 0
    const hasCompleted = overlays.some((row) => row.status === 'completed' && row.result)
    const scorecards = {
      batting: cricbuzz?.scorecards?.batting?.length
        ? cricbuzz.scorecards.batting
        : khelnow?.scorecards?.batting?.length ? khelnow.scorecards.batting : cards?.scorecards?.batting ?? [],
      bowling: cricbuzz?.scorecards?.bowling?.length
        ? cricbuzz.scorecards.bowling
        : khelnow?.scorecards?.bowling?.length ? khelnow.scorecards.bowling : cards?.scorecards?.bowling ?? [],
      fielding: cricbuzz?.scorecards?.fielding?.length
        ? cricbuzz.scorecards.fielding
        : khelnow?.scorecards?.fielding?.length ? khelnow.scorecards.fielding : cards?.scorecards?.fielding ?? [],
    }
    const hasScorecards = Boolean(scorecards.batting.length || scorecards.bowling.length)
    const quota = await quotaSnapshot()

    let message
    if (khelnowLiveFresh) {
      const liveCount = khelnow.matches.filter((row) => row.status === 'live').length
      message = `Live NPL scores from KhelNow (${liveCount} live match${liveCount === 1 ? '' : 'es'}).`
    } else if (cricbuzzLiveFresh) {
      message = `Live NPL scores from Cricbuzz (${cricbuzz.liveMatches} live match${cricbuzz.liveMatches === 1 ? '' : 'es'}).`
    } else if (cricbuzzFresh) {
      message = 'NPL scores updated from Cricbuzz.'
    } else if (!config.cricbuzzApiKey && !hasKhelNowData) {
      message = 'Live scores are not connected. Set CRICKETDATA_API_KEY or configure a live-score provider on the server.'
    } else if (hasMapped) {
      message = `Mapped ${overlays.length} NPL 2026 match${overlays.length === 1 ? '' : 'es'}${series?.name ? ` from ${series.name}` : ' from Cricbuzz'}.`
    } else if (quota.lastError) {
      message = 'CricketData.org could not be reached. Live scores are unavailable until the provider connection recovers.'
    } else if (!available) {
      message = 'No NPL live scores are available from Cricbuzz right now.'
    } else {
      message = `${series.name} was found, but matches could not be mapped onto the local NPL 2026 fixture list.`
    }

    return {
      overlay: {
        matches: overlays,
        scorecards,
        squads: info?.squads ?? [],
      },
      meta: {
        provider: 'Cricbuzz',
        available,
        coverage: available ? (hasMapped ? 'partial' : 'series-only') : 'none',
        message,
        fetchedAt: newest?.fetchedAt ?? null,
        expiresAt: newest?.expiresAt ?? null,
        liveFresh,
        liveMatchIds,
        lastUpdatedLabel: cricbuzz?.fetchedAt ?? newest?.fetchedAt ?? null,
        quota,
        series,
      },
      capabilities: {
        fixtures: hasMapped,
        liveScores: liveFresh,
        results: hasCompleted,
        scorecards: hasScorecards,
        playerStats: hasScorecards,
        standings: hasCompleted,
        squads: Boolean(info?.squads?.length),
      },
      series,
    }
  }

  return {
    config,
    store,
    async getFeed({ allowRefresh = true } = {}) {
      if (allowRefresh) {
        try {
          await maybeAutoRefresh()
        } catch (error) {
          await store.addEvent({ dataset: DATASETS.FEED, action: 'error', detail: error.message, ok: false })
        }
      }
      const cricbuzz = await getCricbuzzLive()
      const feed = await buildFeed(cricbuzz)
      await writeCache(DATASETS.FEED, DATASETS.FEED, feed, config.ttl.live, 'ok')
      return feed
    },
    async refresh(dataset, { force = true, source = 'manual' } = {}) {
      const allowed = new Set(Object.values(DATASETS))
      if (!allowed.has(dataset)) {
        throw new Error('Unknown dataset.')
      }
      if (dataset === DATASETS.FEED) {
        await maybeAutoRefresh()
        return this.getFeed({ allowRefresh: false })
      }
      await refreshDataset(dataset, { force, source })
      return this.getFeed({ allowRefresh: false })
    },
    async adminStatus() {
      const caches = await store.listCache()
      const events = await store.listEvents()
      const cricbuzz = await getCricbuzzLive()
      const feed = await buildFeed(cricbuzz)
      return {
        provider: PROVIDER,
        keyConfigured: Boolean(config.apiKey),
        cricbuzzConfigured: Boolean(config.cricbuzzApiKey),
        store: store.kind,
        quota: await quotaSnapshot(),
        caches: caches.map((row) => ({
          key: row.key,
          dataset: row.dataset,
          status: row.status,
          fetchedAt: row.fetchedAt,
          expiresAt: row.expiresAt,
          ageMs: row.fetchedAt ? nowFn().getTime() - new Date(row.fetchedAt).getTime() : null,
          error: row.error ?? null,
        })),
        events,
        feed,
        datasets: Object.values(DATASETS).filter((key) => key !== DATASETS.FEED && key !== DATASETS.MATCH_INFO),
      }
    },
    quotaSnapshot,
    emptyFeed,
  }
}

let singleton

export function getCricketdataService() {
  if (!singleton) singleton = createCricketdataService()
  return singleton
}

export function resetCricketdataService() {
  singleton = null
}

export { emptyFeed }
