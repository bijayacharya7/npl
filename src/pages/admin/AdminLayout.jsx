import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { Seo } from '../../components/ui.jsx'

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/teams', label: 'Teams', icon: Shield },
  { to: '/admin/players', label: 'Players & staff', icon: Users },
  { to: '/admin/matches', label: 'Fixtures & scores', icon: CalendarDays },
  { to: '/admin/articles', label: 'News articles', icon: FileText },
  { to: '/admin/settings', label: 'Rules & data', icon: Settings },
]

export default function AdminLayout() {
  const { isDemo } = useData()
  return (
    <div className="container admin-shell">
      <Seo title="Admin dashboard" noIndex />
      <aside className="admin-side">
        <p className="admin-side-title">Content management</p>
        <nav className="admin-nav" aria-label="Admin sections">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        {isDemo && (
          <div className="notice notice-gold" style={{ marginBottom: '1rem' }}>
            <BarChart3 size={15} aria-hidden="true" />
            <span className="tiny">
              <strong>Single-admin prototype.</strong> Changes and uploaded images are saved in this browser only.
              The demo credentials are for local development and are not safe for a public deployment.
            </span>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  )
}
