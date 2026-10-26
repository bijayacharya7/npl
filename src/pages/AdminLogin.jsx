import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Seo } from '../components/ui.jsx'

export default function AdminLogin() {
  const { user, signIn, authMode } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const usesEmail = authMode === 'supabase' || authMode === 'local'
  const requestedPath = searchParams.get('next') ?? '/admin'
  const destination = requestedPath.startsWith('/admin') && requestedPath !== '/admin/login'
    ? requestedPath
    : '/admin'

  if (user?.isAdmin) return <Navigate to={destination} replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn({ id, password })
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page">
      <Seo title="Admin sign in" noIndex />
      <section className="auth-card" style={{ marginInline: 'auto' }}>
        <span className="eyebrow"><Shield size={14} aria-hidden="true" /> Admin access</span>
        <h1 style={{ fontSize: '2rem', marginTop: '0.45rem' }}>Sign in to the dashboard</h1>
        <p className="small muted" style={{ marginTop: '0.45rem' }}>
          {usesEmail
            ? 'Sign in with the administrator account provided for this site.'
            : authMode === 'local'
              ? 'Use the administrator email and password configured for this site.'
              : 'Admin access is disabled until shared Supabase storage and authentication are configured.'}
        </p>
        <form onSubmit={submit} className="stack" style={{ marginTop: '1.25rem', gap: '0.9rem' }}>
          <div className="field">
            <label className="label" htmlFor="admin-id">{usesEmail ? 'Admin email' : 'Admin ID'}</label>
            <input
              className="input"
              id="admin-id"
              name={usesEmail ? 'email' : 'username'}
              type={usesEmail ? 'email' : 'text'}
              autoComplete={usesEmail ? 'email' : 'username'}
              value={id}
              onChange={(event) => setId(event.target.value)}
              required
              disabled={authMode === 'disabled' || busy}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="admin-password">Password</label>
            <input
              className="input"
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={authMode === 'disabled' || busy}
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || authMode === 'disabled'}>
            <LockKeyhole size={15} aria-hidden="true" />
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-foot"><Link to="/">Back to the NPL site</Link></p>
      </section>
    </div>
  )
}
