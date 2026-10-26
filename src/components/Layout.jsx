import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Info, Menu, Search, Swords, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { SearchOverlay } from './SearchOverlay.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/results', label: 'Results' },
  { to: '/standings', label: 'Standings' },
  { to: '/teams', label: 'Teams' },
  { to: '/transfers', label: 'Transfers' },
  { to: '/stats', label: 'Stats' },
  { to: '/news', label: 'News' },
]


function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname])
  return null
}

export function Layout() {
  const { user, loading, signOut } = useAuth()
  const { isDemo } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (event) => {
      const tag = document.activeElement?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('You have been signed out.')
      navigate('/')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <ScrollToTop />

      {isDemo && (
        <div className="demo-banner">
          <div className="container">
            <Info size={14} aria-hidden="true" />
            <span>
              <strong>Single-admin prototype.</strong> Content edits and uploaded images are saved in this browser only.
            </span>
          </div>
        </div>
      )}

      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="NPL Fan Zone home">
            <span className="brand-mark" aria-hidden="true">
              <Swords size={20} />
            </span>
            <span className="brand-text">
              <strong>
                NPL <span>FAN ZONE</span>
              </strong>
              <small>Nepal Premier League 2026</small>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search teams, players and news"
              title="Search (press /)"
            >
              <Search size={17} aria-hidden="true" />
            </button>

            {!loading && user?.isAdmin ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm hide-sm" onClick={handleSignOut}>
                  Sign out
                </button>
              </>
            ) : null}

            <button
              type="button"
              className="icon-btn menu-btn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div id="mobile-navigation" className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
          <div className="container">
            <nav aria-label="Mobile">
              <ul>
                {NAV_ITEMS.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mobile-auth">
              {user?.isAdmin ? (
                <button type="button" className="btn btn-outline btn-sm" onClick={handleSignOut}>
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <span className="brand-mark" aria-hidden="true">
                <Swords size={20} />
              </span>
              <span className="brand-text">
                <strong>
                  NPL <span>FAN ZONE</span>
                </strong>
                <small>Your home for NPL cricket</small>
              </span>
            </Link>
            <p>
              An independent fan project covering the Nepal Premier League 2026. Built for supporters, not
              affiliated with the tournament.
            </p>
          </div>

          <div className="footer-col">
            <h4>Tournament</h4>
            <ul>
              <li>
                <Link to="/fixtures">Fixtures</Link>
              </li>
              <li>
                <Link to="/results">Results</Link>
              </li>
              <li>
                <Link to="/standings">Points table</Link>
              </li>
              <li>
                <Link to="/teams">Teams</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li>
                <Link to="/stats">Player stats</Link>
              </li>
              <li>
                <Link to="/transfers">Transfers</Link>
              </li>
              <li>
                <Link to="/news">News &amp; explainers</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Data &amp; sources</h4>
            <ul>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/2026_Nepal_Premier_League"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  NPL 2026 schedule &amp; squads
                </a>
              </li>
              <li>
                <a href="https://npl-t20.com" target="_blank" rel="noreferrer noopener">
                  Official NPL website
                </a>
              </li>
              <li>
                <a href="https://cricinfo.com" target="_blank" rel="noreferrer noopener">
                  ESPNcricinfo
                </a>
              </li>
              <li>
                <Link to="/about-data">How we handle data</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="container footer-disclaimer">
          <strong>Independent fan website.</strong> NPL Fan Zone is not affiliated with, endorsed by, or
          operated by the Cricket Association of Nepal (CAN), the Nepal Premier League, or any franchise.
          Team names and colours are used for identification only. No official logos, copyrighted
          photographs or fabricated match data are published. Fixture and squad information is verified
          against public sources and marked with a last-checked date; verify with official channels before
          relying on it.
        </div>

        <div className="container footer-bottom">
          <span>&copy; {new Date().getFullYear()} NPL Fan Zone. Fan-made and independent.</span>
          <span className="row" style={{ gap: '0.9rem' }}>
            <Link to="/privacy">Privacy</Link>
            <span aria-hidden="true">&middot;</span>
            <span>
              Data mode: <strong>{isDemo ? 'Local demo' : 'Supabase'}</strong>
            </span>
          </span>
        </div>
      </footer>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

