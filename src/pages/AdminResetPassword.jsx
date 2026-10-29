import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { Seo } from '../components/ui.jsx'

export default function AdminResetPassword() {
  const { authMode, refresh } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authMode !== 'supabase' || !supabase) {
      setReady(true)
      return undefined
    }

    let active = true
    let settled = false
    const finish = (hasSession) => {
      if (!active || settled) return
      settled = true
      if (!hasSession) setError('This recovery link is invalid or expired. Request a new reset email.')
      setReady(true)
    }

    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          finish(false)
          return
        }
        finish(Boolean(data.session))
      })
      .catch(() => finish(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) finish(Boolean(session))
    })
    const timer = window.setTimeout(() => finish(false), 5000)
    return () => {
      active = false
      window.clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [authMode])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirmation) return setError('Passwords do not match.')
    setBusy(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error('This recovery link is invalid or expired. Request a new reset email.')
      }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await refresh()
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not update the password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page">
      <Seo title="Set admin password" noIndex />
      <section className="auth-card" style={{ marginInline: 'auto' }}>
        <span className="eyebrow"><Shield size={14} aria-hidden="true" /> Admin access</span>
        <h1 style={{ fontSize: '2rem', marginTop: '0.45rem' }}>Set a new password</h1>
        <p className="small muted">Choose a new password for your administrator account.</p>
        {!ready ? (
          <p className="small muted" style={{ marginTop: '1.2rem' }}>Checking the recovery link…</p>
        ) : (
          <form onSubmit={submit} className="stack" style={{ marginTop: '1.25rem', gap: '0.9rem' }}>
            <div className="field">
              <label className="label" htmlFor="new-password">New password</label>
              <input className="input" id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
            </div>
            <div className="field">
              <label className="label" htmlFor="confirm-password">Confirm password</label>
              <input className="input" id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required disabled={busy} />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy || authMode !== 'supabase'}>
              <LockKeyhole size={15} aria-hidden="true" />
              {busy ? 'Saving…' : 'Set password'}
            </button>
          </form>
        )}
        <p className="auth-foot"><Link to="/admin/login">Back to sign in</Link></p>
      </section>
    </div>
  )
}
