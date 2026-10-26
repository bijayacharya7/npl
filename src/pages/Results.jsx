import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, EmptyState, CardSkeleton } from '../components/ui.jsx'
import { MatchCard } from '../components/MatchCard.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'

export default function Results() {
  const { matches, teams, teamsById, loading } = useData()
  const [teamFilter, setTeamFilter] = useState('all')
  const [stage, setStage] = useState('all')

  const completed = useMemo(
    () => matches.filter((match) => ['completed', 'abandoned'].includes(match.status)),
    [matches],
  )

  const filtered = useMemo(
    () =>
      [...completed]
        .filter((match) => {
          if (teamFilter !== 'all' && match.homeTeamId !== teamFilter && match.awayTeamId !== teamFilter) return false
          if (stage === 'league' && match.stage !== 'league') return false
          if (stage === 'playoffs' && match.stage === 'league') return false
          return true
        })
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
    [completed, teamFilter, stage],
  )

  return (
    <div className="container page">
      <Seo
        title="NPL 2026 results"
        description="Verified Nepal Premier League 2026 match results and scorecards. Results are entered manually from official sources."
      />
      <PageHeader
        eyebrow="Match results"
        title="Results"
        description="Only verified results appear here. If a match has not been played or entered, it stays marked as upcoming rather than showing a guessed score."
      />

      <div className="row" style={{ marginBottom: '1.5rem', gap: '0.8rem' }}>
        <div className="field" style={{ minWidth: 200 }}>
          <label className="label" htmlFor="results-team">
            Filter by team
          </label>
          <select
            id="results-team"
            className="select"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
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
        <div className="field" style={{ minWidth: 180 }}>
          <label className="label" htmlFor="results-stage">
            Stage
          </label>
          <select id="results-stage" className="select" value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="all">All stages</option>
            <option value="league">League stage</option>
            <option value="playoffs">Playoffs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No results to show yet" icon={Trophy}>
          {completed.length === 0 ? (
            <>
              The season begins on 26 October 2026. Once an administrator records a result, it will appear
              here with its scorecard and update the points table.{' '}
              <Link to="/fixtures" className="text-link">
                See upcoming fixtures
              </Link>
              .
            </>
          ) : (
            'No completed matches match these filters.'
          )}
        </EmptyState>
      ) : (
        <div className="grid grid-3">
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} teamsById={teamsById} />
          ))}
        </div>
      )}
    </div>
  )
}
