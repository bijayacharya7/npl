import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Search } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, EmptyState, CardSkeleton } from '../components/ui.jsx'
import { MatchRow } from '../components/MatchCard.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { formatDateKey, nptDateKey } from '../lib/format.js'

export default function Fixtures() {
  const { matches, teams, teamsById, loading } = useData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState('all')
  const [stage, setStage] = useState('all')
  const [query, setQuery] = useState('')
  const teamFilter = searchParams.get('team') ?? 'all'

  const dates = useMemo(
    () => [...new Set(matches.map((match) => nptDateKey(match.startTime)))].sort(),
    [matches],
  )

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return matches.filter((match) => {
      if (teamFilter !== 'all' && match.homeTeamId !== teamFilter && match.awayTeamId !== teamFilter) return false
      if (date !== 'all' && nptDateKey(match.startTime) !== date) return false
      if (stage === 'league' && match.stage !== 'league') return false
      if (stage === 'playoffs' && match.stage === 'league') return false
      if (term) {
        const haystack = [
          teamsById[match.homeTeamId]?.name,
          teamsById[match.awayTeamId]?.name,
          match.homeLabel,
          match.awayLabel,
          match.venue,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [matches, teamFilter, date, stage, query, teamsById])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const match of filtered) {
      const key = nptDateKey(match.startTime)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(match)
    }
    return [...map.entries()]
  }, [filtered])

  const reset = () => {
    setDate('all')
    setStage('all')
    setQuery('')
    setSearchParams({})
  }

  return (
    <div className="container page">
      <Seo
        title="NPL 2026 fixtures and schedule"
        description="The complete Nepal Premier League 2026 schedule: all 28 league matches plus Qualifier 1, the Eliminator, Qualifier 2 and the final at Kirtipur."
      />
      <PageHeader
        eyebrow="26 October – 21 November 2026"
        title="Fixtures"
        description="All 32 Nepal Premier League matches, including upcoming fixtures and completed results with scores. Times are Nepal Standard Time (NPT, UTC+05:45)."
      />

      <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
          <div className="field">
            <label className="label" htmlFor="fixture-team">
              Team
            </label>
            <select
              id="fixture-team"
              className="select"
              value={teamFilter}
              onChange={(event) => {
                const value = event.target.value
                setSearchParams(value === 'all' ? {} : { team: value })
              }}
            >
              <option value="all">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
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
            <label className="label" htmlFor="fixture-date">
              Date
            </label>
            <select id="fixture-date" className="select" value={date} onChange={(event) => setDate(event.target.value)}>
              <option value="all">All dates</option>
              {dates.map((key) => (
                <option key={key} value={key}>
                  {formatDateKey(key)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="fixture-stage">
              Stage
            </label>
            <select id="fixture-stage" className="select" value={stage} onChange={(event) => setStage(event.target.value)}>
              <option value="all">League + playoffs</option>
              <option value="league">League stage</option>
              <option value="playoffs">Playoffs</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="fixture-search">
              Search
            </label>
            <div className="row">
              <Search size={15} aria-hidden="true" />
              <input
                id="fixture-search"
                className="input"
                type="search"
                placeholder="Team or venue"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="spread" style={{ marginTop: '0.8rem' }}>
          <span className="small muted">
            {filtered.length} of {matches.length} matches shown
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
            Clear filters
          </button>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No fixtures match these filters" icon={CalendarDays}>
          Try clearing the date, team or stage filters.
        </EmptyState>
      ) : (
        <div className="stack" style={{ gap: '1.8rem' }}>
          {grouped.map(([key, dayMatches]) => (
            <section key={key} aria-labelledby={`date-${key}`}>
              <h2
                id={`date-${key}`}
                style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: 'var(--muted-strong)' }}
              >
                {formatDateKey(key)}
              </h2>
              <div className="stack" style={{ gap: '0.5rem' }}>
                {dayMatches.map((match) => (
                  <MatchRow key={match.id} match={match} teamsById={teamsById} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="notice" style={{ marginTop: '1.8rem' }}>
        <span className="small">
          Schedule source: the 2026 NPL fixture list published by CAN/NPL (last checked 22 October 2026).
          Evening playoff start times follow the revised schedule announced on 20 October 2026. Confirm
          with official channels before travelling.
        </span>
      </div>
    </div>
  )
}
