import { Link } from 'react-router-dom'
import { Crown, Sparkles, UserCheck } from 'lucide-react'
import { TeamBadge } from './TeamBadge.jsx'

export function TeamCard({ team, standing }) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="team-card"
      style={{ '--team-primary': team.primaryColor, '--team-accent': team.accentColor }}
    >
      <div className="team-card-top">
        <TeamBadge team={team} size="lg" />
        <div>
          <h3>{team.name}</h3>
          <span className="team-city">
            {team.city}, {team.province} &bull; {team.abbreviation}
          </span>
          {team.slogan && (
            <span className="tiny muted" style={{ display: 'block', fontStyle: 'italic', marginTop: '2px' }}>
              &ldquo;{team.slogan.split('(')[0].trim()}&rdquo;
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', margin: '0.6rem 0' }}>
        {team.captain && (
          <div className="tiny" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Crown size={12} color="#f5c542" />
            <span>
              Captain: <strong style={{ color: '#fff' }}>{team.captain}</strong>
            </span>
          </div>
        )}
        {team.headCoach && (
          <div className="tiny" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <UserCheck size={12} color="#60a5fa" />
            <span>
              Coach: <strong style={{ color: '#cbd5e1' }}>{team.headCoach}</strong>
              {team.headCoachCountry && <span className="muted"> ({team.headCoachCountry})</span>}
            </span>
          </div>
        )}
      </div>

      <div className="team-card-stats">
        <div>
          <strong>{standing?.played ?? 0}</strong>
          Played
        </div>
        <div>
          <strong>{standing?.won ?? 0}</strong>
          Won
        </div>
        <div>
          <strong>{standing?.points ?? 0}</strong>
          Points
        </div>
        <div>
          <strong>{standing ? `#${standing.position}` : '\u2014'}</strong>
          Position
        </div>
      </div>
    </Link>
  )
}

