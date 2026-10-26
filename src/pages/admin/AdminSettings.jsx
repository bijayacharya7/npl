import { useEffect, useState } from 'react'
import { AlertTriangle, Database, RefreshCw } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { ConfirmDialog, FormError } from '../../components/ui.jsx'
import { TOURNAMENT_RULES_NOTE } from '../../data/tournament.js'
import { resetLocalData } from '../../lib/store/local.js'
import { formatDateTime } from '../../lib/format.js'

const BREAKERS = [
  { id: 'nrr', label: 'Net run rate' },
  { id: 'wins', label: 'Most wins' },
  { id: 'headToHead', label: 'Head-to-head' },
  { id: 'name', label: 'Alphabetical' },
]

export default function AdminSettings() {
  const { rules, store, refresh, isDemo } = useData()
  const toast = useToast()
  const [form, setForm] = useState(rules)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState([])
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    setForm(rules)
  }, [rules])

  useEffect(() => {
    store.listActivity(50).then(setActivity).catch(() => {})
  }, [store])

  const save = async (event) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await store.saveRules(form)
      await store.logActivity('Updated competition rules', 'tournament_rules', `Win ${form.win} pts`)
      await refresh()
      toast.success('Competition rules saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleBreaker = (id) => {
    const current = form.tieBreakers ?? []
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    setForm((state) => ({
      ...state,
      tieBreakers: BREAKERS.map((breaker) => breaker.id).filter((breakerId) => next.includes(breakerId)),
    }))
  }

  return (
    <div>
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">Configuration</span>
          <h1>Rules &amp; data</h1>
          <p className="small muted">
            Standings rules, data-mode details, the activity log and development utilities.
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <div className="card-head">
            <h2 style={{ fontSize: '1.2rem' }}>Competition rules</h2>
          </div>
          <div className="card-body">
            <form className="form" onSubmit={save}>
              <div className="form-grid">
                <div className="field">
                  <label className="label" htmlFor="rule-win">
                    Points for a win
                  </label>
                  <input
                    id="rule-win"
                    className="input"
                    type="number"
                    min="0"
                    value={form.win}
                    onChange={(event) => setForm({ ...form, win: Number(event.target.value) })}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rule-loss">
                    Points for a loss
                  </label>
                  <input
                    id="rule-loss"
                    className="input"
                    type="number"
                    min="0"
                    value={form.loss}
                    onChange={(event) => setForm({ ...form, loss: Number(event.target.value) })}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rule-tie">
                    Points for a tie
                  </label>
                  <input
                    id="rule-tie"
                    className="input"
                    type="number"
                    min="0"
                    value={form.tie}
                    onChange={(event) => setForm({ ...form, tie: Number(event.target.value) })}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rule-nr">
                    Points for a no-result
                  </label>
                  <input
                    id="rule-nr"
                    className="input"
                    type="number"
                    min="0"
                    value={form.noResult}
                    onChange={(event) => setForm({ ...form, noResult: Number(event.target.value) })}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rule-overs">
                    Overs per innings
                  </label>
                  <input
                    id="rule-overs"
                    className="input"
                    type="number"
                    min="1"
                    max="50"
                    value={form.oversPerInnings}
                    onChange={(event) => setForm({ ...form, oversPerInnings: Number(event.target.value) })}
                  />
                </div>
                <div className="field">
                  <label className="checkbox-row" htmlFor="rule-allout">
                    <input
                      id="rule-allout"
                      type="checkbox"
                      checked={Boolean(form.allOutUsesFullQuota)}
                      onChange={(event) => setForm({ ...form, allOutUsesFullQuota: event.target.checked })}
                    />
                    All-out team charged full overs
                  </label>
                </div>
              </div>

              <fieldset style={{ border: 0, padding: 0 }}>
                <legend className="label" style={{ marginBottom: '0.4rem' }}>
                  Tie-break order
                </legend>
                <div className="stack" style={{ gap: '0.35rem' }}>
                  {BREAKERS.map((breaker, index) => (
                    <label className="checkbox-row" key={breaker.id} htmlFor={`breaker-${breaker.id}`}>
                      <input
                        id={`breaker-${breaker.id}`}
                        type="checkbox"
                        checked={(form.tieBreakers ?? []).includes(breaker.id)}
                        onChange={() => toggleBreaker(breaker.id)}
                      />
                      {index + 1}. {breaker.label}
                    </label>
                  ))}
                </div>
                <span className="help">Checked items are applied in the order shown above.</span>
              </fieldset>

              <FormError>{error}</FormError>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? 'Saving\u2026' : 'Save rules'}
              </button>
              <p className="tiny muted">{TOURNAMENT_RULES_NOTE}</p>
            </form>
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2 style={{ fontSize: '1.2rem' }}>Data mode</h2>
            </div>
            <div className="card-body stack" style={{ gap: '0.6rem' }}>
              <p className="small">
                Mode: <strong>{store.mode === 'supabase' ? 'Shared Supabase database' : 'Local development demo'}</strong>
              </p>
              <p className="small">
                Signed in as <strong>{store.mode === 'supabase' ? 'Authenticated administrator' : 'Local demo administrator'}</strong>
              </p>
              <p className="tiny muted">
                {store.mode === 'supabase'
                  ? 'Administrator access is verified by Supabase Auth and database row-level security. Never share the administrator account.'
                  : 'The local shortcut and edits are restricted to this development browser. Configure Supabase before publishing.'}
              </p>
              <div className="notice">
                <Database size={15} aria-hidden="true" />
                <span className="tiny">
                  Live-score API: none configured. Manual score entry remains available. Provider keys must
                  live server-side (never in a VITE_ variable).
                </span>
              </div>
            </div>
          </section>

          {isDemo && (
            <section className="card">
              <div className="card-head">
                <h2 style={{ fontSize: '1.2rem' }}>Development tools</h2>
              </div>
              <div className="card-body">
                <p className="small muted" style={{ marginBottom: '0.7rem' }}>
                  Reset this browser's content to the supplied teams, squads, fixtures and sample articles.
                </p>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmReset(true)}>
                  <RefreshCw size={14} aria-hidden="true" />
                  Reset demo data
                </button>
              </div>
            </section>
          )}

        </div>
      </div>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-head">
          <h2 style={{ fontSize: '1.2rem' }}>Activity log</h2>
          <span className="badge badge-muted">{activity.length} entries</span>
        </div>
        <div className="card-body">
          {activity.length === 0 ? (
            <p className="small muted">No activity recorded yet.</p>
          ) : (
            <div className="stack" style={{ gap: '0.6rem' }}>
              {activity.map((entry) => (
                <div key={entry.id} className="spread" style={{ gap: '0.5rem' }}>
                  <div>
                    <p className="small" style={{ fontWeight: 600 }}>
                      {entry.action} <span className="muted">({entry.entity})</span>
                    </p>
                    <p className="tiny muted">{entry.detail}</p>
                  </div>
                  <p className="tiny muted">
                    {entry.userName} &middot; {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset local demo data?"
        message="Teams, squads, fixtures, articles and admin edits in this browser will return to the shipped sample data. This cannot be undone."
        confirmLabel="Reset data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetLocalData()
          toast.success('Demo data reset. Reloading\u2026')
          setTimeout(() => window.location.reload(), 600)
        }}
      />

      <p className="tiny muted" style={{ marginTop: '1rem' }}>
        <AlertTriangle size={12} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
        Destructive actions require confirmation and are recorded in this browser's activity log.
      </p>
    </div>
  )
}
