import { Link } from 'react-router-dom'
import { EmptyState } from './ui.jsx'
import { buildLeaderboard } from '../lib/cricket.js'
import { TeamBadge } from './TeamBadge.jsx'

export function LeaderboardCard({ title, stats, definition, teamsById, limit = 5, note }) {
  const rows = buildLeaderboard(stats, definition).slice(0, limit)

  return (
    <div className="card">
      <div className="card-head">
        <h3>{title}</h3>
        <Link to="/stats" className="card-link">
          All stats
        </Link>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '0.9rem' }}>
          <EmptyState title="No verified scorecards yet">
            Rankings appear only after an administrator enters real scorecard data. We never fill this
            table with invented statistics.
          </EmptyState>
        </div>
      ) : (
        <div className="leaderboard">
          {rows.map((player, index) => {
            const value = definition.format ? definition.format(definition.value(player)) : definition.value(player)
            return (
              <Link className="leader-row" to={`/players/${player.playerId}`} key={player.playerId}>
                <span className="leader-rank">{index + 1}</span>
                {player.teamId && teamsById[player.teamId] ? (
                  <TeamBadge team={teamsById[player.teamId]} size="sm" />
                ) : null}
                <span className="leader-main">
                  <span className="leader-name">{player.player?.name ?? 'Player'}</span>
                  <span className="leader-sub">{definition.secondary(player)}</span>
                </span>
                <span className="leader-value">
                  {value}
                  <span className="leader-unit">{definition.unit}</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
      {note && (
        <p className="tiny muted" style={{ padding: '0 1.35rem 1rem' }}>
          {note}
        </p>
      )}
    </div>
  )
}
