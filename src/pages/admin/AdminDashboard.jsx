import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDateTime } from '../../lib/format.js'
import { LoadingBlock } from '../../components/ui.jsx'

export default function AdminDashboard() {
  const { teams, players, matches, articles, store } = useData()
  const { user } = useAuth()
  const [activity, setActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    let active = true
    store.listActivity(12).catch(() => []).then((log) => {
      if (active) setActivity(log)
    }).finally(() => {
      if (active) setActivityLoading(false)
    })
    return () => {
      active = false
    }
  }, [store])

  const openMatches = matches.filter((match) => ['upcoming', 'live'].includes(match.status))
  const completed = matches.filter((match) => match.status === 'completed')
  const unverified = players.filter((player) => !player.verified)
  const samples = articles.filter((article) => article.isSample)
  const missingInnings = matches.filter(
    (match) => ['completed', 'live'].includes(match.status) && (!match.innings || match.innings.length < 2),
  )

  return (
    <div>
      <div className="spread" style={{ marginBottom: '1.2rem' }}>
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Dashboard</h1>
          <p className="small muted">Signed in as {user?.displayName ?? 'Administrator'}. Manage NPL content and match data here.</p>
        </div>
        <div className="row">
          <Link to="/admin/matches" className="btn btn-primary btn-sm">
            <Plus size={14} aria-hidden="true" />
            Enter a result
          </Link>
          <Link to="/admin/articles" className="btn btn-outline btn-sm">
            <Plus size={14} aria-hidden="true" />
            New article
          </Link>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <strong>{teams.length}</strong>
          <span>Teams</span>
        </div>
        <div className="stat-card">
          <strong>{players.length}</strong>
          <span>Players</span>
        </div>
        <div className="stat-card">
          <strong>{openMatches.length}</strong>
          <span>Upcoming / live matches</span>
        </div>
        <div className="stat-card">
          <strong>{completed.length}</strong>
          <span>Completed matches</span>
        </div>
        <div className="stat-card">
          <strong>{articles.length}</strong>
          <span>Articles</span>
        </div>
        <div className="stat-card">
          <strong>{articles.filter((article) => article.status === 'published').length}</strong>
          <span>Published articles</span>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <div className="card-head">
            <h2 style={{ fontSize: '1.2rem' }}>Data health</h2>
          </div>
          <div className="card-body stack" style={{ gap: '0.7rem' }}>
            <HealthRow
              ok={unverified.length === 0}
              label={`${unverified.length} unverified player record${unverified.length === 1 ? '' : 's'}`}
              detail="Cross-check squad trackers, then mark verified."
              to="/admin/players"
            />
            <HealthRow
              ok={missingInnings.length === 0}
              label={`${missingInnings.length} live/completed match${missingInnings.length === 1 ? '' : 'es'} without both innings`}
              detail="Add innings totals so standings and NRR stay correct."
              to="/admin/matches"
            />
            <HealthRow
              ok={samples.length === 0}
              label={`${samples.length} article${samples.length === 1 ? '' : 's'} still marked as sample content`}
              detail="Replace or unmark before a public launch."
              to="/admin/articles"
            />
            <div className="notice">
              <Clock size={15} aria-hidden="true" />
              <span className="tiny">
                Live scores are manual. No external cricket API is configured; matches marked live must be
                updated here.
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 style={{ fontSize: '1.2rem' }}>Recent activity</h2>
          </div>
          <div className="card-body">
            {activity.length === 0 ? (
              <p className="small muted">
                No admin actions logged yet. Saves, edits and deletions are recorded here with a timestamp.
              </p>
            ) : (
              <div className="stack" style={{ gap: '0.65rem' }}>
                {activity.map((entry) => (
                  <div key={entry.id}>
                    <p className="small" style={{ fontWeight: 600 }}>
                      {entry.action} <span className="muted">&middot; {entry.entity}</span>
                    </p>
                    <p className="tiny muted">
                      {entry.userName} &middot; {formatDateTime(entry.createdAt)}
                      {entry.detail ? ` \u00b7 ${entry.detail}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="notice" style={{ marginTop: '1.2rem' }}>
        <span className="tiny">
          Tip: enter a match result and both innings in <Link to="/admin/matches" className="text-link">Fixtures &amp; scores</Link>.
          The points table, team records and player leaderboards recalculate automatically &mdash; there is
          no separate standings table to maintain.
        </span>
      </div>

      {activityLoading && <div style={{ marginTop: '1rem' }}><LoadingBlock label="Loading recent activity" /></div>}
    </div>
  )
}

function HealthRow({ ok, label, detail, to }) {
  return (
    <Link to={to} className="row" style={{ gap: '0.6rem', alignItems: 'flex-start' }}>
      {ok ? (
        <CheckCircle2 size={16} aria-hidden="true" style={{ color: 'var(--green)', flexShrink: 0 }} />
      ) : (
        <AlertTriangle size={16} aria-hidden="true" style={{ color: '#fbbf24', flexShrink: 0 }} />
      )}
      <span>
        <span className="small" style={{ fontWeight: 600 }}>
          {label}
        </span>
        <span className="tiny muted" style={{ display: 'block' }}>
          {detail}
        </span>
      </span>
    </Link>
  )
}
