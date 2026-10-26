import { TeamLogo } from './TeamLogos.jsx'
import { TEAM_BY_ID } from '../data/teams.js'

/**
 * Team badge with authentic franchise vector crests, custom team colors,
 * and fallback support for custom uploaded images.
 */
export function TeamBadge({ team, size = 'md', className = '', showTextFallback = false }) {
  const sizeClass =
    size === 'sm' ? 'team-badge-sm' : size === 'lg' ? 'team-badge-lg' : size === 'xl' ? 'team-badge-xl' : ''

  if (!team) {
    return (
      <span
        className={`team-badge ${sizeClass} ${className}`.trim()}
        style={{ '--team-primary': '#16243a', '--team-accent': '#9fb0c7' }}
        aria-hidden="true"
      >
        TBC
      </span>
    )
  }

  const style = {
    '--team-primary': team.primaryColor || '#16243a',
    '--team-accent': team.accentColor || '#f5c542',
  }

  const pixelSize = size === 'sm' ? 22 : size === 'lg' ? 64 : size === 'xl' ? 84 : 34
  const logoUrl = team.imageUrl || TEAM_BY_ID[team.id]?.imageUrl

  return (
    <span className={`team-badge team-badge--${team.id} ${sizeClass} ${className}`.trim()} style={style} aria-hidden="true" title={team.name}>
      {logoUrl ? (
        <img src={logoUrl} alt="" loading="lazy" />
      ) : showTextFallback ? (
        team.abbreviation
      ) : (
        <TeamLogo teamId={team.id} size={pixelSize} />
      )}
    </span>
  )
}

export function TeamLabel({ team, children, size = 'sm', className = '' }) {
  if (!team) return children ?? <span>Team TBC</span>
  return (
    <span className={`team-label ${className}`.trim()}>
      <TeamBadge team={team} size={size} />
      <span>{children ?? team.name}</span>
    </span>
  )
}

