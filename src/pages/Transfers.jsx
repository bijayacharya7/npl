import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Filter,
  Globe,
  Quote,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, EmptyState } from '../components/ui.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { TRANSFERS, TRANSFER_CATEGORIES } from '../data/transfers.js'
import { formatLongDate } from '../lib/format.js'

export default function Transfers() {
  const { teams, teamsById } = useData()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTransfers = useMemo(() => {
    return TRANSFERS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (selectedTeam !== 'all' && item.teamId !== selectedTeam) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.playerName.toLowerCase().includes(q)
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchTeam = (teamsById[item.teamId]?.name ?? '').toLowerCase().includes(q)
        const matchNat = (item.nationality ?? '').toLowerCase().includes(q)
        if (!matchName && !matchTitle && !matchTeam && !matchNat) return false
      }
      return true
    })
  }, [selectedCategory, selectedTeam, searchQuery, teamsById])

  const stats = useMemo(() => {
    const overseasCount = TRANSFERS.filter((t) => t.category === 'overseas').length
    const coachCount = TRANSFERS.filter((t) => t.category === 'coach').length
    const marqueeCount = TRANSFERS.filter((t) => t.category === 'marquee').length
    return { overseasCount, coachCount, marqueeCount, total: TRANSFERS.length }
  }, [])

  return (
    <div className="container page">
      <Seo
        title="NPL 2026 Transfer News, Signings & Coaching Deals"
        description="Official Nepal Premier League 2026 transfers: international overseas signings like David Warner & Andre Russell, coaching deals including Misbah-ul-Haq & Ajantha Mendis, and franchise retentions."
      />

      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Transfers & Signings' }]}
        title="Transfer Hub & Player Signings"
        description="Track all confirmed international signings, marquee retentions, coaching appointments and squad updates for Nepal Premier League Season 3."
      />

      {/* Top Stat Highlights Bar */}
      <div
        className="stat-tiles"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="stat-tile" style={{ borderTop: '3px solid #f5c542' }}>
          <strong style={{ color: '#f5c542' }}>{stats.total}</strong>
          <span>Confirmed Deals</span>
        </div>
        <div className="stat-tile" style={{ borderTop: '3px solid #22c55e' }}>
          <strong style={{ color: '#22c55e' }}>{stats.overseasCount}</strong>
          <span>Overseas Superstars</span>
        </div>
        <div className="stat-tile" style={{ borderTop: '3px solid #3b82f6' }}>
          <strong style={{ color: '#3b82f6' }}>{stats.coachCount}</strong>
          <span>World Class Coaches</span>
        </div>
        <div className="stat-tile" style={{ borderTop: '3px solid #ec4899' }}>
          <strong style={{ color: '#ec4899' }}>8 / 8</strong>
          <span>Marquee Captains Locked</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div
        className="card"
        style={{
          padding: '1.2rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {TRANSFER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.82rem' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
            />
            <input
              type="text"
              placeholder="Search player, coach or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
        </div>

        {/* Team Badges Quick Filter */}
        <div
          style={{
            marginTop: '1.2rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            overflowX: 'auto',
            paddingBottom: '0.4rem',
          }}
        >
          <span className="tiny muted" style={{ whiteSpace: 'nowrap', marginRight: '0.4rem' }}>
            Filter by Team:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTeam('all')}
            className={`tag ${selectedTeam === 'all' ? 'tag-captain' : ''}`}
            style={{ cursor: 'pointer', padding: '4px 10px' }}
          >
            All Franchises
          </button>
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTeam(t.id)}
              className={`tag ${selectedTeam === t.id ? 'tag-captain' : ''}`}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
              }}
              title={t.name}
            >
              <TeamBadge team={t} size="sm" />
              <span>{t.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transfers Listing Grid */}
      {filteredTransfers.length === 0 ? (
        <EmptyState title="No transfers found" icon={Users}>
          Try adjusting your search query or filters.
        </EmptyState>
      ) : (
        <div className="transfer-grid">
          {filteredTransfers.map((item) => {
            const team = teamsById[item.teamId]
            return (
              <article
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${team?.primaryColor || '#f5c542'}`,
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div className="card-body" style={{ padding: '1.4rem' }}>
                  {/* Header: Team & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <Link
                      to={`/teams/${item.teamId}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}
                    >
                      <TeamBadge team={team} size="md" />
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#fff', display: 'block' }}>{team?.name}</strong>
                        <span className="tiny muted">{formatLongDate(item.date)}</span>
                      </div>
                    </Link>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span
                        className="tag tag-captain"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle2 size={11} /> {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Transfer Type Badge */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background:
                          item.category === 'overseas'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : item.category === 'coach'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(245, 197, 66, 0.15)',
                        color:
                          item.category === 'overseas'
                            ? '#4ade80'
                            : item.category === 'coach'
                              ? '#60a5fa'
                              : '#f5c542',
                        border: '1px solid currentColor',
                      }}
                    >
                      {item.type}
                    </span>
                  </div>

                  {/* Headline Title */}
                  <h3 style={{ fontSize: '1.15rem', lineHeight: 1.35, marginBottom: '0.8rem', color: '#f8fafc' }}>
                    {item.title}
                  </h3>

                  {/* Player / Coach Key Metadata */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.8rem',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.9rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <span className="muted tiny" style={{ display: 'block' }}>
                        Player / Coach
                      </span>
                      <strong style={{ color: '#fff' }}>{item.playerName}</strong>
                    </div>
                    <div>
                      <span className="muted tiny" style={{ display: 'block' }}>
                        Role
                      </span>
                      <span>{item.playerRole}</span>
                    </div>
                    <div>
                      <span className="muted tiny" style={{ display: 'block' }}>
                        Nationality
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={11} /> {item.nationality}
                      </span>
                    </div>
                  </div>

                  {/* Story Description */}
                  <p className="small muted" style={{ lineHeight: 1.5, marginBottom: '1rem' }}>
                    {item.description}
                  </p>

                  {/* Official Quote */}
                  {item.quote && (
                    <div
                      style={{
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(245, 197, 66, 0.05)',
                        borderLeft: '3px solid #f5c542',
                        fontStyle: 'italic',
                        fontSize: '0.83rem',
                        color: '#f1f5f9',
                        marginBottom: '1rem',
                        display: 'flex',
                        gap: '8px',
                      }}
                    >
                      <Quote size={14} style={{ flexShrink: 0, opacity: 0.7, marginTop: '2px' }} />
                      <span>&ldquo;{item.quote}&rdquo;</span>
                    </div>
                  )}

                  {/* Career Highlights */}
                  {item.highlights && item.highlights.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Accolades & Pedigree:
                      </span>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {item.highlights.map((h, i) => (
                          <li key={i} style={{ marginBottom: '2px' }}>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Footer Link */}
                <div
                  style={{
                    padding: '0.8rem 1.4rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className="tiny muted">
                    Previous: <strong>{item.previousTeam}</strong>
                  </span>
                  <Link
                    to={`/teams/${item.teamId}`}
                    className="text-link"
                    style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    View Squad <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
