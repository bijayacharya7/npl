import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Search } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, EmptyState, TableSkeleton, DataNote } from '../components/ui.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { ALL_TIME_RUNS, ALL_TIME_WICKETS, CHAMPIONS, RECORDS_AS_OF, RECORD_SOURCES, TOURNAMENT_RECORDS } from '../data/records.js'
import {
  LEADERBOARD_DEFINITIONS,
  buildLeaderboard,
  computePlayerStats,
  bestBowlingLabel,
  decimalOrDash,
} from '../lib/cricket.js'

const ORDER = [
  'runs',
  'highScore',
  'battingAverage',
  'strikeRate',
  'wickets',
  'bestBowling',
  'bowlingAverage',
  'economy',
  'sixes',
  'fours',
  'catches',
  'stumpings',
  'pom',
]

const SPECIAL = {
  bestBowling: { label: 'Best bowling figures', unit: 'figs' },
  pom: { label: 'Player of the match awards', unit: 'awards' },
}

const DEFINITIONS = LEADERBOARD_DEFINITIONS.map((definition) => ({
  ...definition,
  special: null,
}))

const CATEGORIES = ORDER.map((id) => {
  const definition = DEFINITIONS.find((item) => item.id === id)
  if (definition) return definition
  return { id, ...SPECIAL[id], special: id }
})

function HistoricalLeaderboard({ title, rows, stat, statLabel, secondary, teamsById }) {
  return (
    <section className="card" aria-label={title}>
      <div className="card-head">
        <h3 style={{ fontSize: '1.1rem' }}>{title}</h3>
        <span className="badge badge-muted">Top {rows.length}</span>
      </div>
      <div className="leaderboard">
        {rows.map((row, index) => (
          <div className="leader-row" key={row.name}>
            <span className="leader-rank">{index + 1}</span>
            <TeamBadge team={Object.values(teamsById).find((team) => team.name === row.team)} size="sm" />
            <span className="leader-main">
              <span className="leader-name">{row.name}</span>
              <span className="leader-sub">{row.team}{secondary(row) ? ` · ${secondary(row)}` : ''}</span>
            </span>
            <span className="leader-value">{row[stat]}<span className="leader-unit">{statLabel}</span></span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Stats() {
  const { scorecards, matches, players, teams, teamsById, loading } = useData()
  const [category, setCategory] = useState('runs')
  const [teamFilter, setTeamFilter] = useState('all')
  const [stage, setStage] = useState('all')
  const [query, setQuery] = useState('')

  const matchIds = useMemo(() => {
    if (stage === 'all') return null
    return new Set(
      matches
        .filter((match) => (stage === 'league' ? match.stage === 'league' : match.stage !== 'league'))
        .map((match) => match.id),
    )
  }, [matches, stage])

  const filterRow = (row) => {
    if (teamFilter !== 'all' && row.teamId !== teamFilter) return false
    if (matchIds && !matchIds.has(row.matchId)) return false
    return true
  }

  const stats = useMemo(
    () =>
      computePlayerStats({
        batting: scorecards.batting.filter(filterRow),
        bowling: scorecards.bowling.filter(filterRow),
        fielding: scorecards.fielding.filter(filterRow),
        matches,
        players,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scorecards, matches, players, teamFilter, matchIds],
  )

  const pomCounts = useMemo(() => {
    const counts = new Map()
    for (const match of matches) {
      if (!match.playerOfMatchId) continue
      if (matchIds && !matchIds.has(match.id)) continue
      const player = players.find((item) => item.id === match.playerOfMatchId)
      if (!player) continue
      if (teamFilter !== 'all' && player.teamId !== teamFilter) continue
      const current = counts.get(player.id) ?? { player, count: 0 }
      current.count += 1
      counts.set(player.id, current)
    }
    return [...counts.values()].sort((a, b) => b.count - a.count)
  }, [matches, matchIds, players, teamFilter])

  const active = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0]

  const rows = useMemo(() => {
    if (active.special === 'bestBowling') {
      return stats
        .filter((player) => player.bestBowling)
        .sort(
          (a, b) =>
            b.bestBowling.wickets - a.bestBowling.wickets ||
            a.bestBowling.runsConceded - b.bestBowling.runsConceded,
        )
        .map((player) => ({
          player,
          value: bestBowlingLabel(player.bestBowling),
          secondary: `${player.wickets} wkts \u00b7 Econ ${decimalOrDash(player.economy)}`,
        }))
    }
    if (active.special === 'pom') {
      return pomCounts.map((row) => ({
        player: {
          ...row.player,
          player: row.player,
          teamId: row.player.teamId,
          secondary: `${row.player.role ?? 'role TBC'}`,
        },
        value: row.count,
        secondary: `${row.count} player-of-the-match award${row.count === 1 ? '' : 's'}`,
      }))
    }
    return buildLeaderboard(stats, active).map((player) => ({
      player,
      value: active.format ? active.format(active.value(player)) : active.value(player),
      secondary: active.secondary(player),
    }))
  }, [active, stats, pomCounts])

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) => {
      const name = row.player.player?.name ?? row.player.name ?? ''
      return name.toLowerCase().includes(term)
    })
  }, [rows, query])

  const hasAnyData =
    scorecards.batting.length > 0 || scorecards.bowling.length > 0 || scorecards.fielding.length > 0

  return (
    <div className="container page">
      <Seo
        title="NPL 2026 player statistics"
        description="Nepal Premier League 2026 leaderboards: most runs, most wickets, best averages, strike rates, economy, sixes, catches and player-of-the-match awards."
      />
      <PageHeader
        eyebrow="Verified scorecards only"
        title="Player statistics"
        description="Season 3 starts on 26 October. Explore NPL career records through 2025, then follow this season’s scorecard-based stats as matches are played."
      />

      <section className="section" aria-labelledby="historical-records-heading">
        <div className="section-head">
          <div>
            <span className="eyebrow">Two completed seasons</span>
            <h2 id="historical-records-heading">NPL records</h2>
            <p className="small muted">All-time figures are through the end of Season 2. Season 3 had not started as of 23 October 2026.</p>
          </div>
          <span className="badge badge-muted">{RECORDS_AS_OF}</span>
        </div>

        <div className="grid grid-4" style={{ marginBottom: '1.2rem' }}>
          {TOURNAMENT_RECORDS.map((record) => (
            <article className="card card-pad" key={record.label}>
              <span className="tiny muted">{record.label}</span>
              <strong style={{ display: 'block', fontSize: '1.5rem', margin: '0.35rem 0' }}>{record.value}</strong>
              <span className="small muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {record.teamId && <TeamBadge team={teamsById[record.teamId]} size="sm" />}
                {record.detail}
              </span>
            </article>
          ))}
        </div>

        <div className="grid grid-2" style={{ marginBottom: '1.2rem' }}>
          <HistoricalLeaderboard title="All-time run scorers" rows={ALL_TIME_RUNS} stat="runs" statLabel="runs" teamsById={teamsById} secondary={(row) => `${row.matches} matches · Avg ${row.average} · SR ${row.strikeRate}`} />
          <HistoricalLeaderboard title="All-time wicket takers" rows={ALL_TIME_WICKETS} stat="wickets" statLabel="wkts" teamsById={teamsById} secondary={() => ''} />
        </div>

        <section className="card" aria-labelledby="champions-heading">
          <div className="card-head"><h3 id="champions-heading" style={{ fontSize: '1.1rem' }}>NPL champions</h3><span className="badge badge-muted">Seasons 1–2</span></div>
          <div className="leaderboard">
            {CHAMPIONS.map((item) => (
              <div className="leader-row" key={item.season}>
                <span className="leader-rank">🏆</span>
                <span className="leader-main">
                  <span className="leader-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TeamBadge team={teamsById[item.championId]} size="sm" />{item.champion}</span>
                  <span className="leader-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>{item.season} · Runner-up: <TeamBadge team={teamsById[item.runnerUpId]} size="sm" />{item.runnerUp}</span>
                </span>
                <span className="leader-value" style={{ fontSize: '0.85rem' }}>{item.result}</span>
              </div>
            ))}
          </div>
        </section>
        <p className="tiny muted" style={{ marginTop: '0.65rem' }}>
          Historical record sources: {RECORD_SOURCES.map((source, index) => (
            <span key={source.url}>{index > 0 ? ' · ' : ''}<a className="text-link" href={source.url} target="_blank" rel="noreferrer noopener">{source.label}</a></span>
          ))}. Figures are historical tournament aggregates; current-season tables below only include scorecards entered into this site.
        </p>
        <div className="notice" style={{ marginTop: '1rem' }}>
          <strong>Coming in Season 3:</strong> The ICC has granted official T20 status to the 2026 edition, and CAN will use DRS in every match. Season 3 runs from 26 October to 21 November at Kirtipur; its scorecards will count toward official T20 career records.
        </div>
      </section>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <>
          <div className="card card-pad" style={{ marginBottom: '1.25rem' }}>
            <div className="row" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
              {CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chip ${category === item.id ? 'active' : ''}`}
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              className="form-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.8rem' }}
            >
              <div className="field">
                <label className="label" htmlFor="stats-team">
                  Team
                </label>
                <select
                  id="stats-team"
                  className="select"
                  value={teamFilter}
                  onChange={(event) => setTeamFilter(event.target.value)}
                >
                  <option value="all">All teams</option>
                  {teams.map((team) => (
                    <option value={team.id} key={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {teamFilter !== 'all' && teamsById[teamFilter] && (
                  <span className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <TeamBadge team={teamsById[teamFilter]} size="sm" />{teamsById[teamFilter].name}
                  </span>
                )}
              </div>
              <div className="field">
                <label className="label" htmlFor="stats-stage">
                  Stage
                </label>
                <select id="stats-stage" className="select" value={stage} onChange={(event) => setStage(event.target.value)}>
                  <option value="all">All matches</option>
                  <option value="league">League stage</option>
                  <option value="playoffs">Playoffs</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="stats-search">
                  Player
                </label>
                <div className="row">
                  <Search size={15} aria-hidden="true" />
                  <input
                    id="stats-search"
                    className="input"
                    type="search"
                    placeholder="Search a player"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {!hasAnyData ? (
            <EmptyState title="No statistics available yet" icon={BarChart3}>
              The 2026 season has not produced verified scorecards in this application. Admins can add
              batting and bowling figures in the match centre; leaderboards are then calculated
              automatically. No placeholder numbers are shown.
            </EmptyState>
          ) : filteredRows.length === 0 ? (
            <EmptyState title="No players match these filters">
              Try a different team, stage or search term.
            </EmptyState>
          ) : (
            <div className="card">
              <div className="card-head">
                <h2 style={{ fontSize: '1.2rem' }}>{active.label}</h2>
                <span className="badge badge-muted">{filteredRows.length} players</span>
              </div>
              <div className="leaderboard">
                {filteredRows.slice(0, 30).map((row, index) => {
                  const player = row.player.player ?? row.player
                  const team = teamsById[row.player.teamId]
                  return (
                    <Link className="leader-row" to={`/players/${player.id}`} key={player.id}>
                      <span className="leader-rank">{index + 1}</span>
                      {team ? <TeamBadge team={team} size="sm" /> : <span className="team-badge team-badge-sm">TBC</span>}
                      <span className="leader-main">
                        <span className="leader-name">{player.name}</span>
                        <span className="leader-sub">
                          {team?.abbreviation ?? 'TBC'} &middot; {row.secondary}
                        </span>
                      </span>
                      <span className="leader-value">
                        {row.value}
                        <span className="leader-unit">{active.unit}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <DataNote>
              <span className="tiny">
                <strong>How these are calculated:</strong> batting average = runs / dismissals; strike rate
                = runs per 100 balls; bowling average = runs conceded / wickets; economy = runs conceded per
                over using legal balls. Catches and stumpings require fielding data. Player-of-the-match
                awards come from admin-entered match records.
              </span>
            </DataNote>
          </div>
        </>
      )}
    </div>
  )
}
