import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingBlock } from './ui.jsx'

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="container page"><LoadingBlock label="Checking admin access" /></div>
  if (!user?.isAdmin) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }

  return children
}
