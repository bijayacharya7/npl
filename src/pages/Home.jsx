import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, CalendarDays, Globe, MapPin, Sparkles, Trophy } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, SectionHeader, EmptyState } from '../components/ui.jsx'
import { MatchCard, StatusBadge } from '../components/MatchCard.jsx'
import { TeamBadge, TeamLabel } from '../components/TeamBadge.jsx'
import { Countdown } from '../components/Countdown.jsx'
import { StandingsTable } from '../components/StandingsTable.jsx'
import { LeaderboardCard } from '../components/Leaderboards.jsx'
import { TeamCard } from '../components/TeamCard.jsx'
import { ArticleCard } from '../components/ArticleCard.jsx'
import { LEADERBOARD_DEFINITIONS } from '../lib/cricket.js'
import { formatMatchDate, formatMatchTime } from '../lib/format.js'
import { TOURNAMENT } from '../data/tournament.js'
import { TRANSFERS } from '../data/transfers.js'


const runsDef = LEADERBOARD_DEFINITIONS.find((d) => d.id === 'runs')
const wicketsDef = LEADERBOARD_DEFINITIONS.find((d) => d.id === 'wickets')

function HeroMatchStatus({ match, teamsById }) {
  const [now, setNow] = useState(() => Date.now())
  const hasStarted = match.status === 'live' || new Date(match.startTime).getTime() <= now
  const inningsByTeam = new Map((match.innings ?? []).map((innings) => [innings.teamId, innings]))

  useEffect(() => {
    if (hasStarted) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [hasStarted])

  if (!hasStarted) return <Countdown target={match.startTime} />

  const score = (teamId) => {
    const innings = inningsByTeam.get(teamId)
    if (!innings) return 'Waiting for score'
    const wickets = Number(innings.wickets) >= 10 ? '' : `/${innings.wickets}`
    return `${innings.runs}${wickets} (${innings.overs} ov)`
  }
  const teamName = (teamId, fallback) => teamsById[teamId]?.name ?? fallback ?? 'Team pending'

  return (
    <div className="live-score-summary" aria-live="polite">
      <div className="live-score-summary-label">
        <span className="live-dot" aria-hidden="true" />
        LIVE UPDATES
      </div>
      <div className="live-score-summary-row">
        <span>{teamName(match.homeTeamId, match.homeLabel)}</span>
        <strong>{score(match.homeTeamId)}</strong>
      </div>
      <div className="live-score-summary-row">
        <span>{teamName(match.awayTeamId, match.awayLabel)}</span>
        <strong>{score(match.awayTeamId)}</strong>
      </div>
      {!match.innings?.length && (
        <p className="tiny muted" style={{ marginTop: '0.45rem', textAlign: 'center' }}>
          Live score feed connecting; updates will appear automatically.
        </p>
      )}
    </div>
  )
}

export default function Home() {
  const { teams, matches, teamsById, standings, playerStats, publishedArticles, loading, error, refresh, rules } =
    useData()

  const nextMatch = useMemo(() => {
    const now = Date.now()
    return (
      matches.find((match) => match.status === 'live') ??
      matches.find((match) => match.status === 'upcoming' && new Date(match.startTime).getTime() > now) ??
      matches.find((match) => match.status === 'upcoming') ??
      null
    )
  }, [matches])

  const liveMatch = useMemo(() => {
    return matches.find((match) => match.status === 'live') ?? null
  }, [matches])

  const upcoming = useMemo(

    () => matches.filter((match) => match.status === 'upcoming').slice(0, 3),
    [matches],
  )
  const recentResults = useMemo(
    () =>
      matches
        .filter((match) => match.status === 'completed')
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 3),
    [matches],
  )

  if (loading) {
    return (
      <div className="container page">
        <div className="skeleton skeleton-title" />
        <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo
        title="NPL 2026 fixtures, standings and news"
        description="Follow Nepal Premier League 2026: fixtures, squads, points table, player stats, transfer updates and news. Independent NPL coverage."
      />

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="live-dot" aria-hidden="true" />
              NPL Season 3 &middot; {formatMatchDate(TOURNAMENT.startDate)} &ndash;{' '}
              {formatMatchDate(TOURNAMENT.endDate)} 2026
            </span>
            <h1 className="hero-title">
              Nepal&rsquo;s cricket summer.
              <br />
              <span>All in one fan zone.</span>
            </h1>
            <p className="hero-lead">
              Eight franchises. Thirty-two matches. One Kirtipur ground. Follow the Nepal Premier League
              with live tables, squads, match centres and verified player stats &mdash; built for supporters, not
              sponsored by the league.
            </p>
            <div className="hero-actions">
              <Link to="/fixtures" className="btn btn-primary">
                <CalendarDays size={16} aria-hidden="true" />
                Explore fixtures
              </Link>
              <Link to="/teams" className="btn btn-outline">
                <ArrowRight size={16} aria-hidden="true" />
                Meet the teams
              </Link>
            </div>
            <div className="hero-facts">
              <div className="hero-fact">
                <strong>8</strong>
                <span>Franchises</span>
              </div>
              <div className="hero-fact">
                <strong>32</strong>
                <span>Matches</span>
              </div>
              <div className="hero-fact">
                <strong>28</strong>
                <span>League games</span>
              </div>
              <div className="hero-fact">
                <strong>1</strong>
                <span>Venue</span>
              </div>
            </div>
          </div>

          <div className="hero-side">
            {nextMatch ? (
              <div className="hero-panel">
                <div className="hero-panel-top">
                  <span>Next match &middot; Match {nextMatch.matchNo}</span>
                  <StatusBadge
                    status={nextMatch.status}
                    liveConfirmed={nextMatch.liveConfirmed}
                    statusSource={nextMatch.statusSource}
                  />
                </div>
                <div className="hero-team-row">
                  <div className="hero-team">
                    <TeamBadge team={nextMatch.homeTeamId ? teamsById[nextMatch.homeTeamId] : null} size="lg" />
                    <span>{nextMatch.homeTeamId ? teamsById[nextMatch.homeTeamId]?.shortName : nextMatch.homeLabel}</span>
                  </div>
                  <span className="hero-vs">VS</span>
                  <div className="hero-team">
                    <TeamBadge team={nextMatch.awayTeamId ? teamsById[nextMatch.awayTeamId] : null} size="lg" />
                    <span>{nextMatch.awayTeamId ? teamsById[nextMatch.awayTeamId]?.shortName : nextMatch.awayLabel}</span>
                  </div>
                </div>
                <p className="tiny muted" style={{ textAlign: 'center', marginTop: '0.7rem' }}>
                  {formatMatchDate(nextMatch.startTime)} &middot; {formatMatchTime(nextMatch.startTime)} NPT
                  <br />
                  <MapPin size={11} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} /> TU
                  Cricket Ground, Kirtipur
                </p>
                <HeroMatchStatus match={nextMatch} teamsById={teamsById} />
                <Link to={`/matches/${nextMatch.id}`} className="btn btn-outline btn-block" style={{ marginTop: '0.9rem' }}>
                  Open match centre
                </Link>
              </div>
            ) : (
              <EmptyState title="No upcoming match found">The schedule will appear here once available.</EmptyState>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {/* Real-time Live Score Ticker (Only appears when a game is genuinely live) */}
        {liveMatch && (
          <div
            className="live-ticker-banner"
            style={{
              margin: '1.2rem 0',
              padding: '0.8rem 1.2rem',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, rgba(230, 57, 70, 0.15) 0%, rgba(245, 197, 66, 0.12) 100%)',
              border: '1px solid rgba(245, 197, 66, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#b91c1c',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  letterSpacing: '0.06em',
                  boxShadow: '0 0 10px rgba(230, 57, 70, 0.5)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#fff',
                  }}
                />
                LIVE NOW
              </span>
              <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', color: '#f8fafc' }}>
                <TeamLabel team={teamsById[liveMatch.homeTeamId]} size="sm" />
                <span>vs</span>
                <TeamLabel team={teamsById[liveMatch.awayTeamId]} size="sm" />
                {liveMatch.innings && liveMatch.innings.length > 0 && (
                  <> &bull; {liveMatch.innings[liveMatch.innings.length - 1].runs}/{liveMatch.innings[liveMatch.innings.length - 1].wickets} ({liveMatch.innings[liveMatch.innings.length - 1].overs} ov)</>
                )}
              </span>
            </div>
            <Link
              to={`/matches/${liveMatch.id}`}
              className="btn btn-sm btn-primary"
              style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Activity size={13} />
              Open Live Match &rarr;
            </Link>
          </div>
        )}


        {error && (
          <div className="notice notice-red" role="alert" style={{ marginTop: '1.2rem' }}>
            {error}{' '}
            <button type="button" className="btn btn-outline btn-sm" onClick={refresh}>
              Retry
            </button>
          </div>
        )}


        <section className="section" aria-labelledby="upcoming-heading">
          <SectionHeader
            eyebrow="Plan your cricket days"
            title={<span id="upcoming-heading">Upcoming fixtures</span>}
            description="All matches are at TU International Cricket Ground, Kirtipur. Times are Nepal Standard Time."
            action={
              <Link to="/fixtures" className="btn btn-outline btn-sm">
                All 32 matches
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming fixtures">Check the results page for completed matches.</EmptyState>
          ) : (
            <div className="grid grid-3">
              {upcoming.map((match) => (
                <MatchCard key={match.id} match={match} teamsById={teamsById} />
              ))}
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="table-heading">
          <div className="split">
            <div>
              <div className="section-head" style={{ marginBottom: '1rem' }}>
                <div>
                  <span className="eyebrow">The race to the top</span>
                  <h2 id="table-heading">Points table</h2>
                </div>
                <Link to="/standings" className="card-link">
                  Full standings
                </Link>
              </div>
              <StandingsTable rows={standings} teamsById={teamsById} compact rules={rules} />
            </div>
            <div className="stack">
              <LeaderboardCard
                title="Top run scorers"
                stats={playerStats}
                definition={runsDef}
                teamsById={teamsById}
                limit={4}
              />
              <LeaderboardCard
                title="Top wicket takers"
                stats={playerStats}
                definition={wicketsDef}
                teamsById={teamsById}
                limit={4}
              />
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="results-heading">
          <SectionHeader
            eyebrow="Verified results only"
            title={<span id="results-heading">Latest results</span>}
            description="Results appear only after an administrator enters a verified scorecard. No match result here is simulated."
            action={
              <Link to="/results" className="card-link">
                All results
              </Link>
            }
          />
          {recentResults.length === 0 ? (
            <EmptyState title="No completed matches yet" icon={Trophy}>
              The 2026 season starts on 26 October. Once results are entered, batting and bowling
              scorecards and the points table update automatically.
            </EmptyState>
          ) : (
            <div className="grid grid-3">
              {recentResults.map((match) => (
                <MatchCard key={match.id} match={match} teamsById={teamsById} />
              ))}
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="teams-heading">
          <SectionHeader
            eyebrow="Eight franchises, one trophy"
            title={<span id="teams-heading">Meet the teams</span>}
            description="Captains and head coaches are verified against published 2026 squad lists. Squads carry an unverified flag where sources disagree."
            action={
              <Link to="/teams" className="card-link">
                All team pages
              </Link>
            }
          />
          <div className="grid grid-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} standing={standings.find((row) => row.teamId === team.id)} />
            ))}
          </div>
        </section>

        {/* Headline Transfers Section */}
        <section className="section" aria-labelledby="transfers-heading">
          <SectionHeader
            eyebrow="Season 3 Signings"
            title={<span id="transfers-heading">Headline transfers &amp; international signings</span>}
            description="David Warner, Andre Russell, Shakib Al Hasan, Misbah-ul-Haq and more headline the confirmed Season 3 acquisitions."
            action={
              <Link to="/transfers" className="card-link">
                All transfers &rarr;
              </Link>
            }
          />
          <div className="grid grid-3">
            {TRANSFERS.slice(0, 3).map((item) => {
              const team = teamsById[item.teamId]
              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '1.2rem',
                    borderTop: `3px solid ${team?.primaryColor || '#f5c542'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span className="tag tag-captain">{item.type}</span>
                      <span className="tiny muted">{item.nationality}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <TeamBadge team={team} size="sm" />
                      <strong style={{ fontSize: '0.95rem' }}>{team?.name}</strong>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', lineHeight: 1.35, margin: '0 0 0.5rem 0' }}>
                      {item.title}
                    </h3>
                    <p className="small muted" style={{ margin: 0, lineHeight: 1.45 }}>
                      {item.description}
                    </p>
                  </div>
                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' }}>
                    <Link to="/transfers" className="text-link small" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Read details &amp; quotes &rarr;
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>


        <section className="section" aria-labelledby="news-heading">
          <SectionHeader
            eyebrow="From the fan zone"
            title={<span id="news-heading">News &amp; explainers</span>}
            description="Original explainer content. Sample articles are labelled until replaced by real editorial."
            action={
              <Link to="/news" className="card-link">
                All articles
              </Link>
            }
          />
          {publishedArticles.length === 0 ? (
            <EmptyState title="No articles published yet">Admins can publish the first article from the dashboard.</EmptyState>
          ) : (
            <div className="grid grid-3">
              {publishedArticles.slice(0, 3).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  )
}
