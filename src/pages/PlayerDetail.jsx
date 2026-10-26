import { Link, useParams } from 'react-router-dom'
import { Info, ShieldCheck } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, EmptyState, LoadingBlock, PageHeader, VerificationBadge } from '../components/ui.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { ROLE_LABELS } from '../data/players.js'
import { bestBowlingLabel, highScoreLabel, ballsToOvers } from '../lib/cricket.js'
import { formatLongDate, initials } from '../lib/format.js'

function decimal(value) {
  return value === null || value === undefined || !Number.isFinite(value) ? '\u2014' : value.toFixed(2)
}

export default function PlayerDetail() {
  const { playerId } = useParams()
  const { playersById, teamsById, playerStats, loading } = useData()
  const player = playersById[playerId]

  if (loading) {
    return (
      <div className="container page">
        <LoadingBlock label="Loading player" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="container page">
        <Seo title="Player not found" noIndex />
        <EmptyState title="Player not found">
          <Link to="/teams" className="text-link">
            Browse teams and squads
          </Link>
        </EmptyState>
      </div>
    )
  }

  const team = teamsById[player.teamId]
  const stats = playerStats.find((row) => row.playerId === player.id)
  const hasBatting = Boolean(stats && stats.innings > 0)
  const hasBowling = Boolean(stats && stats.ballsBowled > 0)

  return (
    <div className="container page">
      <Seo
        title={`${player.name} — ${team?.name ?? 'NPL 2026'}`}
        description={`${player.name} profile: ${player.role ?? 'role unverified'}, ${player.nationality ?? 'nationality TBC'}, ${team?.name ?? 'NPL 2026'}. Squad and statistics from verified scorecards only.`}
      />
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Teams', to: '/teams' },
          { label: team?.name ?? 'Team', to: team ? `/teams/${team.id}` : undefined },
          { label: player.name },
        ]}
      />

      <section className="player-profile-head">
        {player.imageUrl ? (
          <img className="player-avatar player-avatar-lg" src={player.imageUrl} alt={player.name} loading="lazy" />
        ) : (
          <span className="player-avatar player-avatar-lg" aria-hidden="true">
            {initials(player.name)}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="row" style={{ gap: '0.5rem' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)' }}>{player.name}</h1>
            {player.isCaptain && <span className="tag tag-captain">Captain</span>}
          </div>
          <p className="muted" style={{ marginTop: '0.3rem' }}>
            {player.role ? ROLE_LABELS[player.role] : 'Role not verified'} &middot;{' '}
            {player.nationality ?? 'Nationality not verified'}
          </p>
          <div className="row" style={{ marginTop: '0.7rem' }}>
            {team && (
              <Link to={`/teams/${team.id}`} className="row" style={{ gap: '0.45rem' }}>
                <TeamBadge team={team} size="sm" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{team.name}</span>
              </Link>
            )}
            <VerificationBadge verified={player.verified} />
            {player.jerseyNumber != null && <span className="tag">#{player.jerseyNumber}</span>}
          </div>
        </div>
      </section>

      <div className="notice" style={{ marginBottom: '1.5rem' }}>
        <Info size={15} aria-hidden="true" />
        <span className="small">
          Squad membership from {player.source?.label ?? 'published 2026 squad lists'}, last checked{' '}
          {formatLongDate(player.lastVerified ?? '2026-10-22')}. {player.bio ? player.bio : 'A full career biography has not been verified, so we have not written one. Statistics below come only from scorecards entered for this season.'}
        </span>
      </div>

      <section aria-labelledby="player-stats">
        <div className="section-head" style={{ marginBottom: '0.9rem' }}>
          <div>
            <span className="eyebrow">NPL 2026 season</span>
            <h2 id="player-stats" style={{ fontSize: '1.7rem' }}>
              Season statistics
            </h2>
          </div>
        </div>

        {!hasBatting && !hasBowling ? (
          <EmptyState title="No scorecard data yet" icon={ShieldCheck}>
            This player&rsquo;s season statistics will appear once an administrator enters verified
            scorecards. We do not estimate or fabricate numbers.
          </EmptyState>
        ) : (
          <>
            <div className="stat-tiles">
              <div className="stat-tile">
                <strong>{stats.runs}</strong>
                <span>Runs</span>
              </div>
              <div className="stat-tile">
                <strong>{highScoreLabel(stats)}</strong>
                <span>High score</span>
              </div>
              <div className="stat-tile">
                <strong>{decimal(stats.battingAverage)}</strong>
                <span>Batting average</span>
              </div>
              <div className="stat-tile">
                <strong>{decimal(stats.strikeRate)}</strong>
                <span>Strike rate</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.wickets}</strong>
                <span>Wickets</span>
              </div>
              <div className="stat-tile">
                <strong>{bestBowlingLabel(stats.bestBowling)}</strong>
                <span>Best bowling</span>
              </div>
              <div className="stat-tile">
                <strong>{decimal(stats.economy)}</strong>
                <span>Economy</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.catches + stats.stumpings}</strong>
                <span>Catches + stumpings</span>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <div className="card-head">
                  <h3>Batting</h3>
                </div>
                <div className="card-body">
                  <table className="data-table" style={{ minWidth: 0 }}>
                    <tbody>
                      <tr>
                        <td>Innings</td>
                        <td className="num">{stats.innings}</td>
                      </tr>
                      <tr>
                        <td>Runs</td>
                        <td className="num">{stats.runs}</td>
                      </tr>
                      <tr>
                        <td>Balls faced</td>
                        <td className="num">{stats.ballsFaced}</td>
                      </tr>
                      <tr>
                        <td>Not outs</td>
                        <td className="num">{stats.notOuts}</td>
                      </tr>
                      <tr>
                        <td>Fifties / hundreds</td>
                        <td className="num">
                          {stats.fifties} / {stats.hundreds}
                        </td>
                      </tr>
                      <tr>
                        <td>Fours / sixes</td>
                        <td className="num">
                          {stats.fours} / {stats.sixes}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <div className="card-head">
                  <h3>Bowling</h3>
                </div>
                <div className="card-body">
                  <table className="data-table" style={{ minWidth: 0 }}>
                    <tbody>
                      <tr>
                        <td>Overs bowled</td>
                        <td className="num">{ballsToOvers(stats.ballsBowled)}</td>
                      </tr>
                      <tr>
                        <td>Wickets</td>
                        <td className="num">{stats.wickets}</td>
                      </tr>
                      <tr>
                        <td>Runs conceded</td>
                        <td className="num">{stats.runsConceded}</td>
                      </tr>
                      <tr>
                        <td>Bowling average</td>
                        <td className="num">{decimal(stats.bowlingAverage)}</td>
                      </tr>
                      <tr>
                        <td>Economy</td>
                        <td className="num">{decimal(stats.economy)}</td>
                      </tr>
                      <tr>
                        <td>Best figures</td>
                        <td className="num">{bestBowlingLabel(stats.bestBowling)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
