import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { RequireAdmin } from './components/ProtectedRoute.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Teams = lazy(() => import('./pages/Teams.jsx'))
const TeamDetail = lazy(() => import('./pages/TeamDetail.jsx'))
const PlayerDetail = lazy(() => import('./pages/PlayerDetail.jsx'))
const Fixtures = lazy(() => import('./pages/Fixtures.jsx'))
const Results = lazy(() => import('./pages/Results.jsx'))
const MatchDetail = lazy(() => import('./pages/MatchDetail.jsx'))
const Standings = lazy(() => import('./pages/Standings.jsx'))
const Stats = lazy(() => import('./pages/Stats.jsx'))
const AllTimeStats = lazy(() => import('./pages/AllTimeStats.jsx'))
const News = lazy(() => import('./pages/News.jsx'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail.jsx'))
const Transfers = lazy(() => import('./pages/Transfers.jsx'))
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'))
const AboutData = lazy(() => import('./pages/InfoPages.jsx').then((module) => ({ default: module.AboutData })))
const Privacy = lazy(() => import('./pages/InfoPages.jsx').then((module) => ({ default: module.Privacy })))
const NotFound = lazy(() => import('./pages/InfoPages.jsx').then((module) => ({ default: module.NotFound })))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'))
const AdminTeams = lazy(() => import('./pages/admin/AdminTeams.jsx'))
const AdminPlayers = lazy(() => import('./pages/admin/AdminPlayers.jsx'))
const AdminMatches = lazy(() => import('./pages/admin/AdminMatches.jsx'))
const AdminArticles = lazy(() => import('./pages/admin/AdminArticles.jsx'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'))

export default function App() {
  return (
    <Suspense fallback={<div className="container page"><div className="skeleton skeleton-title" /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="teams" element={<Teams />} />
          <Route path="teams/:teamId" element={<TeamDetail />} />
          <Route path="players/:playerId" element={<PlayerDetail />} />
          <Route path="fixtures" element={<Fixtures />} />
          <Route path="results" element={<Results />} />
          <Route path="matches/:matchId" element={<MatchDetail />} />
          <Route path="standings" element={<Standings />} />
          <Route path="stats" element={<Stats />} />
          <Route path="stats/all-time" element={<AllTimeStats />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="news" element={<News />} />
          <Route path="news/:slug" element={<ArticleDetail />} />
          <Route path="about-data" element={<AboutData />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="admin/login" element={<AdminLogin />} />

          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="players" element={<AdminPlayers />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
