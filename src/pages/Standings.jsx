import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, ListOrdered } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, TableSkeleton, EmptyState, DataNote } from '../components/ui.jsx'
import { StandingsTable } from '../components/StandingsTable.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { MatchRow } from '../components/MatchCard.jsx'
import { formatNRR } from '../lib/cricket.js'
import { TOURNAMENT_RULES_NOTE } from '../data/tournament.js'

const TIE_BREAK_LABELS = {
  nrr: 'Net run rate',
  wins: 'Most wins',
  headToHead: 'Head-to-head record',
  name: 'Alphabetical order',
}

export default function Standings() {
  const { standings, teams, teamsById, matches, rules, loading } = useData()
  const [selected, setSelected] = useState('')

  const teamRow = standings.find((row) => row.teamId === selected)
  const team = selected ? teamsById[selected] : null
  const nextFixture = selected
    ? matches.find(
        (match) =>
          (match.homeTeamId === selected || match.awayTeamId === selected) &&
          (match.status === 'upcoming' || match.status === 'live'),
      )
    : null
  const hasResults = standings.some((row) => row.played > 0)

  return (
    <div className="container page">
      <Seo
        title="NPL 2026 points table"
        description="Live-calculated Nepal Premier League 2026 standings with matches played, wins, losses, no results, points and net run rate."
      />
      <PageHeader
        eyebrow="Calculated from results"
        title="Points table"
        description="The table is derived automatically from entered match results and innings data. Before the first match every team has zero matches and zero points — no invented standings."
      />

      {loading ? (
        <TableSkeleton rows={8} />
      ) : standings.length === 0 ? (
        <EmptyState title="No teams loaded" icon={ListOrdered}>
          Add teams in the admin dashboard to build the table.
        </EmptyState>
      ) : (
        <>
          {!hasResults && (
            <div className="notice notice-gold" style={{ marginBottom: '1rem' }}>
              <Info size={15} aria-hidden="true" />
              <span className="small">
                <strong>Preseason table.</strong> No league match results have been entered yet, so every
                team sits on zero. Standings will update as soon as an administrator records a result.
              </span>
            </div>
          )}

          <StandingsTable rows={standings} teamsById={teamsById} rules={rules} />

          <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="card">
              <div className="card-head">
                <h3>How the table is calculated</h3>
              </div>
              <div className="card-body stack" style={{ gap: '0.7rem' }}>
                <p className="small">
                  Win: {rules?.win ?? 2} points. Tie: {rules?.tie ?? 1} point. No result:{' '}
                  {rules?.noResult ?? 1} point. Loss: {rules?.loss ?? 0} points. Only league-stage matches
                  count towards the table; playoff results do not change it.
                </p>
                <p className="small">
                  Net run rate = (runs scored / overs faced) &minus; (runs conceded / overs bowled). An
                  all-out team that batted fewer than {rules?.oversPerInnings ?? 20} overs is charged the
                  full {rules?.oversPerInnings ?? 20} overs, per standard T20 practice.
                </p>
                <p className="small">
                  Tie-breaks in use:{' '}
                  {(rules?.tieBreakers ?? []).map((key) => TIE_BREAK_LABELS[key] ?? key).join(' → ')}.
                </p>
                <DataNote>
                  <span className="tiny">{TOURNAMENT_RULES_NOTE}</span>
                </DataNote>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Team view</h3>
              </div>
              <div className="card-body">
                <label className="label" htmlFor="standings-team">
                  Choose a team
                </label>
                <select
                  id="standings-team"
                  className="select"
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                  style={{ marginTop: '0.3rem' }}
                >
                  <option value="">Select a team</option>
                  {teams.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                {team && teamRow ? (
                  <div style={{ marginTop: '1rem' }}>
                    <div className="row" style={{ gap: '0.6rem' }}>
                      <TeamBadge team={team} />
                      <div>
                        <strong>{team.name}</strong>
                        <p className="tiny muted">
                          {teamRow.played} played &middot; {teamRow.won} won &middot; {teamRow.lost} lost
                        </p>
                      </div>
                      <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>
                        #{teamRow.position} &middot; {teamRow.points} pts
                      </span>
                    </div>
                    <table className="data-table" style={{ minWidth: 0, marginTop: '0.8rem' }}>
                      <tbody>
                        <tr>
                          <td>Net run rate</td>
                          <td className={`num ${teamRow.nrr > 0 ? 'nrr-pos' : teamRow.nrr < 0 ? 'nrr-neg' : ''}`}>
                            {formatNRR(teamRow.nrr)}
                          </td>
                        </tr>
                        <tr>
                          <td>Ties / no results</td>
                          <td className="num">
                            {teamRow.tied} / {teamRow.noResult}
                          </td>
                        </tr>
                        <tr>
                          <td>Runs scored / conceded</td>
                          <td className="num">
                            {teamRow.runsFor} / {teamRow.runsAgainst}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {nextFixture && (
                      <div style={{ marginTop: '0.9rem' }}>
                        <p className="label" style={{ marginBottom: '0.4rem' }}>
                          Next match
                        </p>
                        <MatchRow match={nextFixture} teamsById={teamsById} />
                      </div>
                    )}
                    <div className="row" style={{ marginTop: '0.9rem' }}>
                      <Link to={`/teams/${team.id}`} className="btn btn-outline btn-sm">
                        Team page
                      </Link>
                      <Link to={`/fixtures?team=${team.id}`} className="btn btn-ghost btn-sm">
                        Team fixtures
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="small muted" style={{ marginTop: '0.9rem' }}>
                    Select a team to see its record, run rate and next fixture. The full table above always
                    shows all eight franchises.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
