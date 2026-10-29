import { Link } from 'react-router-dom'
import { TeamBadge } from './TeamBadge.jsx'
import { formatNRR } from '../lib/cricket.js'
import { DataNote } from './ui.jsx'
import { TOURNAMENT_RULES_NOTE } from '../data/tournament.js'

export function StandingsTable({ rows, teamsById, compact = false, rules }) {
  return (
    <div>
      <div className="table-wrap">
        <table className="data-table stack-mobile-table">
          <caption className="sr-only">Nepal Premier League 2026 points table, calculated from match data</caption>
          <thead>
            <tr>
              <th scope="col" style={{ width: 44 }}>
                Pos
              </th>
              <th scope="col">Team</th>
              <th scope="col" className="num">
                Pld
              </th>
              <th scope="col" className="num">
                W
              </th>
              <th scope="col" className="num">
                L
              </th>
              <th scope="col" className="num">
                T
              </th>
              <th scope="col" className="num">
                NR
              </th>
              <th scope="col" className="num">
                Pts
              </th>
              <th scope="col" className="num">
                NRR
              </th>
              <th scope="col" className="num" aria-label="Matches played">
                Form
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const team = teamsById[row.teamId]
              return (
                <tr
                  key={row.teamId}
                  className={!compact && row.position <= 4 ? 'qualify-row' : undefined}
                >
                  <td data-label="Pos" className={`pos-cell ${row.position <= 4 ? 'top' : ''}`}>{row.position}</td>
                  <td data-label="Team">
                    <Link to={`/teams/${row.teamId}`} className="team-cell">
                      <TeamBadge team={team} size="sm" />
                      <span>{team?.name ?? row.teamId}</span>
                    </Link>
                  </td>
                  <td data-label="Played" className="num">{row.played}</td>
                  <td data-label="Won" className="num">{row.won}</td>
                  <td data-label="Lost" className="num">{row.lost}</td>
                  <td data-label="Tied" className="num">{row.tied}</td>
                  <td data-label="No result" className="num">{row.noResult}</td>
                  <td data-label="Points" className="num" style={{ fontWeight: 800, color: 'var(--gold)' }}>
                    {row.points}
                  </td>
                  <td data-label="NRR" className={`num ${row.nrr > 0 ? 'nrr-pos' : row.nrr < 0 ? 'nrr-neg' : ''}`}>
                    {formatNRR(row.nrr)}
                  </td>
                  <td data-label="Form" className="num">
                    <span className="form-list">
                      {row.form.length === 0 ? (
                        <span className="tiny muted">&mdash;</span>
                      ) : (
                        row.form.map((result, index) => (
                          <span key={index} className={`form-pill ${result}`}>
                            {result.charAt(0)}
                          </span>
                        ))
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!compact && (
        <div style={{ marginTop: '0.9rem' }}>
          <DataNote>
            <span className="tiny">
              Points are calculated automatically from entered results using {rules?.win ?? 2} points for a
              win and {rules?.tie ?? 1} for a tie or no-result. Net run rate is derived from innings data.
              {' '}
              {TOURNAMENT_RULES_NOTE}
            </span>
          </DataNote>
        </div>
      )}
    </div>
  )
}
