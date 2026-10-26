import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Crown,
  Globe,
  Info,
  MapPin,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, EmptyState, LoadingBlock } from '../components/ui.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { MatchRow } from '../components/MatchCard.jsx'
import { formatNRR } from '../lib/cricket.js'
import { initials, formatLongDate } from '../lib/format.js'
import { getTransfersForTeam } from '../data/transfers.js'

export default function TeamDetail() {
  const { teamId } = useParams()
  const { teamsById, players, matches, standings, loading, rules } = useData()
  const [activeSquadFilter, setActiveSquadFilter] = useState('all')
  const team = teamsById[teamId]

  if (loading) {
    return (
      <div className="container page">
        <LoadingBlock label="Loading team" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container page">
        <Seo title="Team not found" noIndex />
        <EmptyState title="Team not found">
          This team may have been renamed or removed.{" "}
          <Link to="/teams" className="text-link">
            Browse all teams
          </Link>
          .
        </EmptyState>
      </div>
    )
  }

  const squad = players.filter((player) => player.teamId === team.id)
  const standing = standings.find((row) => row.teamId === team.id)
  const teamTransfers = getTransfersForTeam(team.id)
  const teamMatches = matches.filter(
    (match) => match.homeTeamId === team.id || match.awayTeamId === team.id,
  )
  const fixtures = teamMatches.filter((match) => match.status === 'upcoming' || match.status === 'live')
  const results = teamMatches
    .filter((match) => match.status === 'completed' || match.status === 'abandoned')
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

  const roleGroups = [
    { key: 'batter', label: 'Batters' },
    { key: 'wicketkeeper', label: 'Wicketkeepers' },
    { key: 'all-rounder', label: 'All-rounders' },
    { key: 'bowler', label: 'Bowlers' },
    { key: null, label: 'Role not verified' },
  ]

  const displayedPlayers = squad.filter((p) => {
    if (activeSquadFilter === 'all') return true
    if (activeSquadFilter === 'overseas') return p.isOverseas
    return p.role === activeSquadFilter
  })

  return (
    <div className="container page">
      <Seo
        title={`${team.name} squad, logo, fixtures and results`}
        description={`${team.name} at NPL 2026: official vector logo, full squad, captain ${team.captain ?? 'TBC'}, head coach ${team.headCoach ?? 'TBC'}, overseas stars, fixtures, and transfer news.`}
      />

      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Teams', to: '/teams' }, { label: team.name }]}
      />

      <section className="team-hero" style={{ '--team-primary': team.primaryColor }}>
        <TeamBadge team={team} size="xl" />
        <div>
          <span className="eyebrow">
            {team.city}, {team.province} &middot; {team.abbreviation}
          </span>
          <h1>{team.name}</h1>
          {team.slogan && (
            <p style={{ color: '#f5c542', fontWeight: 600, fontStyle: 'italic', margin: '4px 0 8px 0' }}>
              &ldquo;{team.slogan}&rdquo;
            </p>
          )}
          <p>{team.description}</p>
          <div className="team-facts">
            <span className="tag tag-captain">Captain: {team.captain ?? 'To be confirmed'}</span>
            <span className="tag">
              Head coach: {team.headCoach ?? 'To be confirmed'}
              {team.headCoachCountry ? ` (${team.headCoachCountry})` : ''}
            </span>
            {team.marqueePlayer && <span className="tag">Marquee: {team.marqueePlayer}</span>}
            <span className="tag">2025 finish: {team.previousFinish ?? 'Not recorded'}</span>
            {team.homeGround && (
              <span className="tag">
                <MapPin size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> {team.homeGround}
              </span>
            )}
            <span className="tag">
              <CheckCircle2 size={10} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
              Checked {formatLongDate(team.lastVerified ?? '2026-10-22')}
            </span>
          </div>
          <div className="row" style={{ marginTop: '1rem' }}>
            <Link to={`/fixtures?team=${team.id}`} className="btn btn-ghost btn-sm">
              <CalendarDays size={14} aria-hidden="true" />
              Team fixtures
            </Link>
            <Link to="/transfers" className="btn btn-outline btn-sm">
              <Sparkles size={14} aria-hidden="true" />
              All NPL Transfers
            </Link>
          </div>
        </div>
      </section>

      {/* Leadership & Staff Spotlight */}
      <section className="section" aria-labelledby="staff-heading" style={{ marginTop: '1.5rem' }}>
        <div className="section-head" style={{ marginBottom: '1rem' }}>
          <div>
            <span className="eyebrow">Franchise Leadership</span>
            <h2 id="staff-heading" style={{ fontSize: '1.5rem' }}>
              Captain & Coaching Staff
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
          {/* Captain Card */}
          <div className="card" style={{ padding: '1.2rem', borderTop: '3px solid #f5c542' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(245, 197, 66, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Crown size={22} color="#f5c542" />
              </span>
              <div>
                <span className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Franchise Captain
                </span>
                <h3 style={{ fontSize: '1.15rem', margin: '2px 0 0 0' }}>{team.captain}</h3>
              </div>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {team.captainRole ?? 'Leading the squad on field and anchoring the playing XI in Season 3.'}
            </p>
          </div>

          {/* Head Coach Card */}
          <div className="card" style={{ padding: '1.2rem', borderTop: '3px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <UserCheck size={22} color="#3b82f6" />
              </span>
              <div>
                <span className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Head Coach {team.headCoachCountry ? `(${team.headCoachCountry})` : ''}
                </span>
                <h3 style={{ fontSize: '1.15rem', margin: '2px 0 0 0' }}>{team.headCoach}</h3>
              </div>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {team.headCoachBio ?? 'Guiding team strategy, tactical matchups and development from the dugout.'}
            </p>
          </div>

          {/* Assistant Coach & Management */}
          <div className="card" style={{ padding: '1.2rem', borderTop: '3px solid #22c55e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Briefcase size={22} color="#22c55e" />
              </span>
              <div>
                <span className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Assistant Coach & Management
                </span>
                <h3 style={{ fontSize: '1.15rem', margin: '2px 0 0 0' }}>{team.assistantCoach ?? 'Staff'}</h3>
              </div>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              Owner: <strong>{team.owner ?? 'Franchise Ownership'}</strong>. Home: <strong>{team.homeGround}</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Transfers for this Team */}
      {teamTransfers.length > 0 && (
        <section className="section" aria-labelledby="transfers-heading" style={{ marginTop: '1.5rem' }}>
          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <div>
              <span className="eyebrow">Transfer Window & Signings</span>
              <h2 id="transfers-heading" style={{ fontSize: '1.5rem' }}>
                Latest {team.name} Transfers ({teamTransfers.length})
              </h2>
            </div>
            <Link to="/transfers" className="text-link small">
              View all NPL transfers &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1rem' }}>
            {teamTransfers.map((item) => (
              <div key={item.id} className="card" style={{ padding: '1.2rem', borderLeft: '4px solid #f5c542' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="tag tag-captain">{item.type}</span>
                  <span className="tiny muted">{formatLongDate(item.date)}</span>
                </div>
                <h4 style={{ fontSize: '1rem', margin: '0 0 0.4rem 0', color: '#fff' }}>{item.title}</h4>
                <p className="small muted" style={{ margin: '0 0 0.6rem 0' }}>
                  {item.description}
                </p>
                {item.quote && (
                  <blockquote
                    style={{
                      margin: 0,
                      padding: '0.5rem 0.8rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      color: '#cbd5e1',
                    }}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team Record */}
      <section className="section-tight" aria-labelledby="team-record">
        <div className="stat-tiles">


          <div className="stat-tile">
            <strong>{standing?.position ?? '\u2014'}</strong>
            <span>League position</span>
          </div>
          <div className="stat-tile">
            <strong>{standing?.played ?? 0}</strong>
            <span>Played</span>
          </div>
          <div className="stat-tile">
            <strong>
              {standing?.won ?? 0}&ndash;{standing?.lost ?? 0}
            </strong>
            <span>Win &ndash; loss</span>
          </div>
          <div className="stat-tile">
            <strong>{standing?.points ?? 0}</strong>
            <span>Points</span>
          </div>
          <div className="stat-tile">
            <strong className={standing && standing.nrr > 0 ? 'nrr-pos' : standing && standing.nrr < 0 ? 'nrr-neg' : ''}>
              {formatNRR(standing?.nrr ?? 0)}
            </strong>
            <span>Net run rate</span>
          </div>
        </div>
        <p className="tiny muted" id="team-record">
          Record calculated from entered league results. Win = {rules?.win ?? 2} points, tie/no-result ={' '}
          {rules?.tie ?? 1} point.
        </p>
      </section>

      <section className="section" aria-labelledby="squad-heading">
        <div className="section-head">
          <div>
            <span className="eyebrow">Season 3 roster</span>
            <h2 id="squad-heading">Squad</h2>
            <p>
              {squad.length} players listed. Roles are shown only where a published source states them;
              unverified entries are flagged.
            </p>
          </div>
        </div>

        {squad.length === 0 ? (
          <EmptyState title="No squad listed yet" icon={Users}>
            Squad data will appear here once it is added in the admin dashboard.
          </EmptyState>
        ) : (
          <div className="stack" style={{ gap: '1.5rem' }}>
            {roleGroups.map((group) => {
              const groupPlayers = squad.filter((player) => player.role === group.key)
              if (groupPlayers.length === 0) return null
              return (
                <div key={group.label}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.6rem', color: 'var(--muted-strong)' }}>
                    {group.label}{' '}
                    <span className="muted" style={{ fontFamily: 'var(--body)', fontSize: '0.75rem' }}>
                      ({groupPlayers.length})
                    </span>
                  </h3>
                  <div className="player-grid">
                    {groupPlayers.map((player) => (
                      <Link to={`/players/${player.id}`} className="player-card" key={player.id}>
                        {player.imageUrl ? (
                          <img className="player-avatar" src={player.imageUrl} alt="" loading="lazy" />
                        ) : (
                          <span className="player-avatar" aria-hidden="true">
                            {initials(player.name)}
                          </span>
                        )}
                        <span className="player-card-body">
                          <span className="player-card-name">{player.name}</span>
                          <span className="player-card-meta">
                            {player.nationality ?? 'Nationality TBC'}
                            {player.isCaptain && <span className="tag tag-captain">Captain</span>}
                            {player.isOverseas && (
                              <span
                                className="tag"
                                style={{
                                  border: '1px solid #4ade80',
                                  color: '#4ade80',
                                  background: 'rgba(74, 222, 128, 0.1)',
                                }}
                              >
                                Overseas
                              </span>
                            )}
                            {!player.verified && <span className="tag tag-warn">Unverified</span>}
                          </span>

                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="notice" style={{ marginTop: '1.4rem' }}>
          <Info size={15} aria-hidden="true" />
          <span className="small">
            Squad source: {team.source?.label ?? 'published 2026 squad lists'}. Last checked{' '}
            {formatLongDate(team.lastVerified ?? '2026-10-22')}. Jersey numbers are shown only where
            verified, and no player photographs are published without permission.
          </span>
        </div>
      </section>

      <div className="split section">
        <section aria-labelledby="team-fixtures">
          <div className="section-head" style={{ marginBottom: '0.9rem' }}>
            <div>
              <span className="eyebrow">Next up</span>
              <h2 id="team-fixtures" style={{ fontSize: '1.7rem' }}>
                Upcoming fixtures
              </h2>
            </div>
          </div>
          {fixtures.length === 0 ? (
            <EmptyState title="No upcoming fixtures">The season may be complete, or the schedule is not loaded.</EmptyState>
          ) : (
            <div className="stack" style={{ gap: '0.5rem' }}>
              {fixtures.map((match) => (
                <MatchRow key={match.id} match={match} teamsById={teamsById} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="team-results">
          <div className="section-head" style={{ marginBottom: '0.9rem' }}>
            <div>
              <span className="eyebrow">Previous</span>
              <h2 id="team-results" style={{ fontSize: '1.7rem' }}>
                Results
              </h2>
            </div>
          </div>
          {results.length === 0 ? (
            <EmptyState title="No results yet" icon={UserRound}>
              Verified results will appear after matches are completed and entered by an admin.
            </EmptyState>
          ) : (
            <div className="stack" style={{ gap: '0.5rem' }}>
              {results.map((match) => (
                <MatchRow key={match.id} match={match} teamsById={teamsById} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
