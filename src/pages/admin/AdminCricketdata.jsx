import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Database, Radio, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { ConfirmDialog, ErrorState, LoadingBlock } from '../../components/ui.jsx'
import { cricketdataAuthHeaders, fetchCricketdataAdmin, refreshCricketdataDataset } from '../../lib/cricketdata/feed.js'
import { formatDateTime } from '../../lib/format.js'

const DATASET_LABELS = {
  series_search: 'Series discovery',
  series_info: 'Fixtures / series info',
  current_matches: 'Current matches (live list)',
  match_scorecard: 'Scorecards',
  series_squads: 'Squad names',
  npl_feed: 'All stale datasets',
}

function ageLabel(ms) {
  if (ms === null || ms === undefined) return 'never'
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min ago`
  return `${Math.round(ms / 3_600_000)} h ago`
}

export default function AdminCricketdata() {
  const { isDemo, refresh } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const headers = await cricketdataAuthHeaders()
      const next = await fetchCricketdataAdmin(headers)
      setStatus(next)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const runRefresh = async (dataset) => {
    setBusy(true)
    try {
      const headers = await cricketdataAuthHeaders()
      await refreshCricketdataDataset(dataset, headers)
      await load()
      await refresh()
      toast.success('Dataset refresh finished.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  if (error && !status) return <ErrorState message={error} />
  if (!status) return <LoadingBlock label="Loading CricketData.org usage" />

  const quota = status.quota ?? {}
  const remaining = quota.remaining ?? 0
  const confirmDataset = confirm
  const wouldExceed = remaining <= 0

  return (
    <div>
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">Integrations</span>
          <h1>CricketData.org usage</h1>
          <p className="small muted">
            Shared daily budget, cache age and manual refresh. Signed in as {user?.email}. This page never
            shows the API key.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={busy}>
          <RefreshCw size={14} aria-hidden="true" />
          Reload status
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="stat-card">
          <strong>
            {quota.requestCount ?? 0}/{quota.internalLimit ?? 80}
          </strong>
          <span>Internal hits today (UTC)</span>
        </div>
        <div className="stat-card">
          <strong>{remaining}</strong>
          <span>Remaining internal budget</span>
        </div>
        <div className="stat-card">
          <strong>{quota.providerHitsToday ?? '—'}</strong>
          <span>Provider hitsToday</span>
        </div>
        <div className="stat-card">
          <strong>{status.store}</strong>
          <span>Cache store</span>
        </div>
      </div>

      {!status.keyConfigured && (
        <div className="notice notice-gold" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={15} aria-hidden="true" />
          <span className="small">
            <strong>No server key.</strong> Add <code>CRICKETDATA_API_KEY</code> to your local <code>.env</code> or
            host environment. Do not use a <code>VITE_</code> prefix.
          </span>
        </div>
      )}

      {quota.exhausted && (
        <div className="notice" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={15} aria-hidden="true" />
          <span className="small">
            Automatic and manual CricketData.org calls are stopped for the rest of this UTC day, keeping a
            reserve below the provider&rsquo;s 100-hit cap.
          </span>
        </div>
      )}

      {quota.rateLimitedAt && (
        <div className="notice" style={{ marginBottom: '1rem' }}>
          <Radio size={15} aria-hidden="true" />
          <span className="small">Last rate-limit: {formatDateTime(quota.rateLimitedAt)}</span>
        </div>
      )}

      <section className="card" style={{ marginBottom: '1.2rem' }}>
        <div className="card-head">
          <h2 style={{ fontSize: '1.2rem' }}>Coverage</h2>
        </div>
        <div className="card-body stack" style={{ gap: '0.5rem' }}>
          <p className="small">{status.feed?.meta?.message}</p>
          <p className="tiny muted">
            Series: {status.feed?.series?.name ?? 'not found'} · Live confirmed:{' '}
            {status.feed?.meta?.liveFresh ? 'yes' : 'no'} · Last fetch:{' '}
            {status.feed?.meta?.fetchedAt ? formatDateTime(status.feed.meta.fetchedAt) : 'never'}
          </p>
          <p className="tiny muted">
            Store: {status.store}
            {isDemo ? ' (local file/memory cache; configure Supabase service role in production so every visitor shares one cache)' : ''}
          </p>
        </div>
      </section>

      <section className="card" style={{ marginBottom: '1.2rem' }}>
        <div className="card-head">
          <h2 style={{ fontSize: '1.2rem' }}>Cached datasets</h2>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table className="data-table admin-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(status.caches ?? []).map((row) => (
                  <tr key={row.key}>
                    <td>{DATASET_LABELS[row.key] ?? row.key}</td>
                    <td>{row.status}</td>
                    <td>{ageLabel(row.ageMs)}</td>
                    <td>{row.expiresAt ? formatDateTime(row.expiresAt) : '—'}</td>
                    <td className="num">
                      {row.key !== 'npl_feed' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() => setConfirm(row.key)}
                        >
                          Refresh
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: '0.8rem' }}>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setConfirm('npl_feed')}>
              <Database size={14} aria-hidden="true" />
              Refresh stale datasets
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 style={{ fontSize: '1.2rem' }}>Recent jobs</h2>
        </div>
        <div className="card-body">
          {(status.events ?? []).length === 0 ? (
            <p className="small muted">No refresh events yet.</p>
          ) : (
            <div className="stack" style={{ gap: '0.55rem' }}>
              {status.events.map((event) => (
                <p key={event.id} className="tiny">
                  <strong>{event.action}</strong> {event.dataset} · {event.detail} · {formatDateTime(event.createdAt)}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(confirmDataset)}
        title="Refresh CricketData.org dataset?"
        confirmLabel={wouldExceed ? 'Budget exhausted' : 'Refresh'}
        message={
          wouldExceed
            ? 'This refresh is blocked. The internal 80-hit daily budget is exhausted, so the 20-hit reserve stays unused. There is no bypass.'
            : `Refresh ${DATASET_LABELS[confirmDataset] ?? confirmDataset}? Remaining internal budget: ${remaining} of ${quota.internalLimit}. Duplicate in-flight refreshes are ignored, and a failed call keeps the last cache.`
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => (wouldExceed ? setConfirm(null) : runRefresh(confirmDataset))}
      />
    </div>
  )
}
