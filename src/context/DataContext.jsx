import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { computePlayerStats, computeStandings } from '../lib/cricket.js'
import { emptyCricketdataFeed, fetchCricketdataFeed } from '../lib/cricketdata/feed.js'
import { mergeSnapshot } from '../lib/cricketdata/merge.js'
import { feedPollingInterval } from '../lib/cricketdata/polling.js'
import { fetchExternalNews } from '../lib/news.js'
import { store as activeStore, isDemoMode } from '../lib/store/index.js'
import { DEFAULT_POINTS_RULES } from '../data/tournament.js'

const DataContext = createContext(null)

const EMPTY = {
  teams: [],
  players: [],
  matches: [],
  articles: [],
  rules: DEFAULT_POINTS_RULES,
  scorecards: { batting: [], bowling: [], fielding: [] },
}

export function DataProvider({ children }) {
  const [snapshot, setSnapshot] = useState(EMPTY)
  const [feed, setFeed] = useState(emptyCricketdataFeed())
  const [externalArticles, setExternalArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const [next, nextFeed, nextNews] = await Promise.all([
        activeStore.loadSnapshot(),
        fetchCricketdataFeed(),
        fetchExternalNews(),
      ])
      setSnapshot({
        ...EMPTY,
        ...next,
        rules: next.rules ?? DEFAULT_POINTS_RULES,
      })
      setFeed(nextFeed)
      setExternalArticles(nextNews.articles)
    } catch (err) {
      console.error('[NPL Fan Zone] Failed to load data:', err)
      setError(err.message ?? 'Could not load tournament data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const next = await activeStore.loadSnapshot()
        if (!active) return
        setSnapshot({ ...EMPTY, ...next, rules: next.rules ?? DEFAULT_POINTS_RULES })
        setLoading(false)

        // The local snapshot is enough to render the first screen. Do not
        // hold the shell on the remote live-feed request.
        const [nextFeed, nextNews] = await Promise.all([fetchCricketdataFeed(), fetchExternalNews()])
        if (active) setFeed(nextFeed)
        if (active) setExternalArticles(nextNews.articles)
      } catch (err) {
        console.error('[NPL Fan Zone] Failed to load data:', err)
        if (active) setError(err.message ?? 'Could not load tournament data.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer
    const poll = async () => {
      const nextFeed = await fetchCricketdataFeed()
      if (cancelled) return
      setFeed(nextFeed)
      const wait = feedPollingInterval(nextFeed, snapshot.matches)
      timer = setTimeout(poll, wait)
    }
    timer = setTimeout(poll, feedPollingInterval(feed, snapshot.matches))
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [snapshot.matches, feed?.meta?.liveFresh])

  useEffect(() => {
    let active = true
    const refreshNews = async () => {
      const next = await fetchExternalNews()
      if (active) setExternalArticles(next.articles)
    }
    const timer = setInterval(refreshNews, 10 * 60 * 1000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const value = useMemo(() => {
    const merged = mergeSnapshot(snapshot, feed)
    const teams = [...merged.teams].sort((a, b) => a.name.localeCompare(b.name))
    const players = [...merged.players].sort((a, b) => a.name.localeCompare(b.name))
    const matches = [...merged.matches].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    const articles = [...new Map([...merged.articles, ...externalArticles].map((article) => [article.id, article])).values()].sort(
      (a, b) => new Date(b.publishedAt ?? 0) - new Date(a.publishedAt ?? 0),
    )

    const teamsById = Object.fromEntries(teams.map((team) => [team.id, team]))
    const playersById = Object.fromEntries(players.map((player) => [player.id, player]))
    const matchesById = Object.fromEntries(matches.map((match) => [match.id, match]))

    const standings = computeStandings(matches, teams, snapshot.rules)
    const liveStandings = computeStandings(matches, teams, snapshot.rules, 'league', { includeLive: true })
    const hasLiveStandings = matches.some(
      (match) =>
        match.status === 'live' &&
        match.stage === 'league' &&
        match.innings?.some((innings) => innings.teamId === match.homeTeamId) &&
        match.innings?.some((innings) => innings.teamId === match.awayTeamId),
    )
    const playerStats = computePlayerStats({
      batting: merged.scorecards?.batting ?? [],
      bowling: merged.scorecards?.bowling ?? [],
      fielding: merged.scorecards?.fielding ?? [],
      matches,
      players,
    })

    const publishedArticles = articles.filter((article) => article.status === 'published')

    return {
      teams,
      players,
      matches,
      articles,
      publishedArticles,
      rules: snapshot.rules,
      scorecards: merged.scorecards,
      cricketdata: feed,
      teamsById,
      playersById,
      matchesById,
      standings,
      liveStandings,
      hasLiveStandings,
      playerStats,
      loading,
      error,
      refresh,
      store: activeStore,
      isDemo: isDemoMode,
      mode: activeStore.mode,
    }
  }, [snapshot, feed, externalArticles, loading, error, refresh])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside <DataProvider>')
  return context
}
