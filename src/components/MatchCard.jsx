import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { TeamBadge, TeamLabel } from './TeamBadge.jsx'
import { STAGE_LABELS, STATUS_LABELS } from '../data/matches.js'
import { formatMatchDate, formatMatchTime } from '../lib/format.js'

export function StatusBadge({ status, liveConfirmed = false, statusSource }) {
  const showLive = status === 'live' && liveConfirmed
  const className = showLive
    ? 'badge-live'
    : status === 'completed'
      ? 'badge-green'
      : status === 'postponed' || status === 'abandoned' || status === 'live'
        ? 'badge-warn'
        : 'badge-gold'
  return (
    <span className={`badge ${className}`}>
      {showLive && <span className="live-dot" aria-hidden="true" />}
      {showLive ? 'Live' : status === 'live' ? (statusSource === 'schedule' ? 'Live · score pending' : 'Scoring (manual)') : STATUS_LABELS[status] ?? 'Upcoming'}
    </span>
  )
}

function InningsScore({ innings }) {
  if (!innings) return null
  const allOut = Number(innings.wickets) >= 10
  return (
    <span className="team-score">
      {innings.runs}
      {allOut ? '' : `/${innings.wickets}`}
      <span className="tiny muted" style={{ marginLeft: 4 }}>
        ({innings.overs})
      </span>
    </span>
  )
}

export function MatchTeamLine({ team, teamName, innings, isWinner, placeholder }) {
  const name = team?.name ?? teamName ?? 'To be confirmed'
  return (
    <div className={`match-team-line ${isWinner ? 'winner' : ''}`}>
      <TeamBadge team={team} size="sm" />
      <span className="team-name">{name}</span>
      {innings ? <InningsScore innings={innings} /> : <span className="tiny muted">{placeholder ?? ''}</span>}
    </div>
  )
}

export function MatchCard({ match, teamsById }) {
  const home = match.homeTeamId ? teamsById[match.homeTeamId] : null
  const away = match.awayTeamId ? teamsById[match.awayTeamId] : null
  const homeInnings = match.innings?.find((innings) => innings.teamId === match.homeTeamId)
  const awayInnings = match.innings?.find((innings) => innings.teamId === match.awayTeamId)
  const winnerId = match.result?.winnerTeamId

  return (
    <article className="match-card">
      <div className="match-card-top">
        <span>
          {STAGE_LABELS[match.stage] ?? 'Match'} &middot; Match {match.matchNo}
        </span>
        <StatusBadge status={match.status} liveConfirmed={match.liveConfirmed} statusSource={match.statusSource} />
      </div>
      <div className="match-card-body">
        <MatchTeamLine
          team={home}
          teamName={match.homeLabel}
          innings={homeInnings}
          isWinner={winnerId === match.homeTeamId}
          placeholder="Home"
        />
        <MatchTeamLine
          team={away}
          teamName={match.awayLabel}
          innings={awayInnings}
          isWinner={winnerId === match.awayTeamId}
          placeholder="Away"
        />
        {match.result?.summary ? (
          <p className="match-result-line">{match.result.summary}</p>
        ) : match.status === 'live' && match.liveConfirmed ? (
          <p className="tiny muted">
            Live via {match.dataSourceLabel ?? 'CricketData.org'} · updated {match.apiUpdatedAt ? new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kathmandu'}).format(new Date(match.apiUpdatedAt))+' NPT' : 'recently'}
          </p>
        ) : match.status === 'live' && match.statusSource === 'schedule' ? (
          <p className="tiny muted">Scheduled live window; waiting for a verified score feed.</p>
        ) : match.status === 'live' ? (
          <p className="tiny muted">
            Score updated manually by an administrator.
          </p>
        ) : match.status === 'upcoming' ? (
          <p className="tiny muted">Result pending. Scores are only shown once verified and entered.</p>
        ) : null}
      </div>
      <div className="match-card-foot">
        <span>
          {formatMatchDate(match.startTime)} &middot; {formatMatchTime(match.startTime)} NPT
        </span>
        <Link to={`/matches/${match.id}`} className="match-cta">
          Match centre
          <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export function MatchRow({ match, teamsById }) {
  const home = match.homeTeamId ? teamsById[match.homeTeamId] : null
  const away = match.awayTeamId ? teamsById[match.awayTeamId] : null
  const date = new Date(match.startTime)
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu',
    day: '2-digit',
  }).format(date)
  const month = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu',
    month: 'short',
  }).format(date)

  return (
    <Link to={`/matches/${match.id}`} className="fixture-row">
      <div className="fixture-date" aria-hidden="true">
        <strong>{day}</strong>
        <span>{month}</span>
      </div>
      <div className="fixture-main">
        <div className="fixture-matchup">
          <TeamLabel team={home} size="sm">{home?.name ?? match.homeLabel ?? 'TBC'}</TeamLabel>
          <span className="muted">vs</span>
          <TeamLabel team={away} size="sm">{away?.name ?? match.awayLabel ?? 'TBC'}</TeamLabel>
        </div>
        <small>
          {formatMatchTime(match.startTime)} NPT &middot; {STAGE_LABELS[match.stage]} &middot; Match {match.matchNo}
        </small>
      </div>
      <div className="fixture-side">
        <StatusBadge status={match.status} liveConfirmed={match.liveConfirmed} statusSource={match.statusSource} />
        <span className="tiny muted">
          <MapPin size={11} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} /> Kirtipur
        </span>
      </div>
    </Link>
  )
}

export function NextMatchHighlight({ match, teamsById }) {
  if (!match) return null
  const home = match.homeTeamId ? teamsById[match.homeTeamId] : null
  const away = match.awayTeamId ? teamsById[match.awayTeamId] : null
  return (
    <div className="hero-panel">
      <div className="hero-panel-top">
        <span>Next match</span>
          <StatusBadge status={match.status} liveConfirmed={match.liveConfirmed} statusSource={match.statusSource} />
      </div>
      <div className="hero-team-row">
        <div className="hero-team">
          <TeamBadge team={home} size="lg" />
          <span>{home?.shortName ?? match.homeLabel ?? 'TBC'}</span>
        </div>
        <span className="hero-vs">VS</span>
        <div className="hero-team">
          <TeamBadge team={away} size="lg" />
          <span>{away?.shortName ?? match.awayLabel ?? 'TBC'}</span>
        </div>
      </div>
      <div className="hero-panel-foot">
        <span>
          <CalendarDays size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
          {formatMatchDate(match.startTime)}, {formatMatchTime(match.startTime)} NPT
        </span>
        <span>Kirtipur</span>
      </div>
      <Link to={`/matches/${match.id}`} className="btn btn-outline btn-block" style={{ marginTop: '0.9rem' }}>
        Open match centre
      </Link>
    </div>
  )
}
