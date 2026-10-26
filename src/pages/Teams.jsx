import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, EmptyState, CardSkeleton } from '../components/ui.jsx'
import { TeamCard } from '../components/TeamCard.jsx'

export default function Teams() {
  const { teams, standings, loading } = useData()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return teams
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(term) ||
        team.city?.toLowerCase().includes(term) ||
        team.abbreviation?.toLowerCase().includes(term) ||
        team.captain?.toLowerCase().includes(term),
    )
  }, [teams, query])

  return (
    <div className="container page">
      <Seo
        title="NPL 2026 teams and squads"
        description="All eight Nepal Premier League 2026 franchises with squads, captains, head coaches, fixtures and results."
      />
      <PageHeader
        eyebrow="Eight franchises"
        title="NPL 2026 teams"
        description="Every franchise page includes the current squad, captain and head coach, fixtures, results and a verified-data note. Player roles that could not be confirmed are left blank."
      />

      <div className="row" style={{ marginBottom: '1.4rem' }}>
        <label className="sr-only" htmlFor="team-search">
          Search teams
        </label>
        <div className="row" style={{ maxWidth: 400, width: '100%', gap: '0.5rem' }}>
          <Search size={16} aria-hidden="true" />
          <input
            id="team-search"
            className="input"
            type="search"
            placeholder="Search by team, city or captain"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No teams match that search">
          Try a city like Pokhara, or clear the search box.
        </EmptyState>
      ) : (
        <div className="grid grid-4">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} standing={standings.find((row) => row.teamId === team.id)} />
          ))}
        </div>
      )}

      <div className="notice" style={{ marginTop: '1.8rem' }}>
        <span className="small">
          Team names and colours are used for identification only. NPL Fan Zone does not reproduce
          franchise logos. Captains and coaches were checked against published 2026 squad lists on 22
          October 2026.
        </span>
      </div>
    </div>
  )
}
