import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { TeamBadge } from './TeamBadge.jsx'

export function SearchOverlay({ open, onClose }) {
  const { teams, players, publishedArticles, teamsById } = useData()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) {
      setQuery('')
      return undefined
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 40)
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) return { teams: [], players: [], articles: [] }
    const matches = (value) => String(value ?? '').toLowerCase().includes(term)
    return {
      teams: teams.filter((team) => matches(team.name) || matches(team.city) || matches(team.abbreviation)).slice(0, 4),
      players: players
        .filter((player) => matches(player.name) || matches(player.nationality) || matches(player.role))
        .slice(0, 6),
      articles: publishedArticles
        .filter((article) => matches(article.title) || matches(article.category) || matches(article.excerpt))
        .slice(0, 4),
    }
  }, [query, teams, players, publishedArticles])

  if (!open) return null

  const go = (path) => {
    onClose()
    navigate(path)
  }
  const total = results.teams.length + results.players.length + results.articles.length

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search NPL Fan Zone">
        <div className="search-input-row">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teams, players or news&hellip;"
            aria-label="Search teams, players or news"
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="search-results">
          {query.trim().length < 2 && (
            <p className="search-empty">Type at least two characters. Try &ldquo;Lumbini&rdquo; or &ldquo;Nepal&rdquo;.</p>
          )}
          {query.trim().length >= 2 && total === 0 && (
            <p className="search-empty">No teams, players or articles match &ldquo;{query}&rdquo;.</p>
          )}

          {results.teams.length > 0 && (
            <>
              <p className="search-group-label">Teams</p>
              {results.teams.map((team) => (
                <button
                  type="button"
                  key={team.id}
                  className="search-result"
                  onClick={() => go(`/teams/${team.id}`)}
                  style={{ width: '100%', background: 'transparent', border: 0, textAlign: 'left' }}
                >
                  <TeamBadge team={team} size="sm" />
                  <span>
                    {team.name}
                    <small>{team.city} &middot; Captain {team.captain ?? 'TBC'}</small>
                  </span>
                </button>
              ))}
            </>
          )}

          {results.players.length > 0 && (
            <>
              <p className="search-group-label">Players</p>
              {results.players.map((player) => (
                <button
                  type="button"
                  key={player.id}
                  className="search-result"
                  onClick={() => go(`/players/${player.id}`)}
                  style={{ width: '100%', background: 'transparent', border: 0, textAlign: 'left' }}
                >
                  <span className="player-avatar" aria-hidden="true">
                    {player.name.charAt(0)}
                  </span>
                  {teamsById[player.teamId] && <TeamBadge team={teamsById[player.teamId]} size="sm" />}
                  <span>
                    {player.name}
                    <small>
                      {teamsById[player.teamId]?.name ?? 'Team TBC'}
                      {player.role ? ` \u00b7 ${player.role}` : ''}
                      {player.nationality ? ` \u00b7 ${player.nationality}` : ''}
                    </small>
                  </span>
                </button>
              ))}
            </>
          )}

          {results.articles.length > 0 && (
            <>
              <p className="search-group-label">News</p>
              {results.articles.map((article) => (
                <button
                  type="button"
                  key={article.id}
                  className="search-result"
                  onClick={() => go(`/news/${article.slug}`)}
                  style={{ width: '100%', background: 'transparent', border: 0, textAlign: 'left' }}
                >
                  <span>
                    {article.title}
                    <small>
                      {article.category} &middot; {article.author}
                    </small>
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
