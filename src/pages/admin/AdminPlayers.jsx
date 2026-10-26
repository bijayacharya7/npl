import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { ConfirmDialog, FormError, Modal } from '../../components/ui.jsx'
import { ImageUploader } from '../../components/ImageUploader.jsx'
import { TeamBadge } from '../../components/TeamBadge.jsx'
import { ROLE_LABELS, slugify } from '../../data/players.js'

const BLANK = {
  name: '',
  teamId: '',
  role: '',
  nationality: '',
  isCaptain: false,
  jerseyNumber: '',
  verified: false,
  bio: '',
  imageUrl: null,
  lastVerified: '2026-10-22',
}

export default function AdminPlayers() {
  const { players, teams, teamsById, store, refresh } = useData()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return players.filter((player) => {
      if (teamFilter !== 'all' && player.teamId !== teamFilter) return false
      if (!term) return true
      return (
        player.name.toLowerCase().includes(term) ||
        player.nationality?.toLowerCase().includes(term) ||
        player.role?.toLowerCase().includes(term)
      )
    })
  }, [players, query, teamFilter])

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setEditing((current) => ({ ...current, [field]: value }))
  }

  const save = async (event) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const payload = {
        ...editing,
        id: editing.id ?? slugify(editing.name),
        role: editing.role || null,
        jerseyNumber: editing.jerseyNumber === '' ? null : editing.jerseyNumber,
      }
      await store.savePlayer(payload)
      await store.logActivity(editing.id ? 'Updated player' : 'Created player', 'players', editing.name)
      await refresh()
      toast.success(`${editing.name} saved.`)
      setEditing(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await store.deletePlayer(deleting.id)
      await store.logActivity('Deleted player', 'players', deleting.name)
      await refresh()
      toast.success('Player removed.')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">Squads</span>
          <h1>Players &amp; staff</h1>
          <p className="small muted">
            Add players, set roles, captains and jersey numbers. Head coaches are managed on each team.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setError(null)
            setEditing({ ...BLANK, teamId: teams[0]?.id ?? '' })
          }}
        >
          <Plus size={14} aria-hidden="true" />
          Add player
        </button>
      </div>

      <div className="row" style={{ marginBottom: '1rem', gap: '0.6rem' }}>
        <div className="field" style={{ minWidth: 190 }}>
          <label className="label" htmlFor="admin-player-team">
            Team
          </label>
          <select
            id="admin-player-team"
            className="select"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
          >
            <option value="all">All teams ({players.length})</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 220 }}>
          <label className="label" htmlFor="admin-player-search">
            Search
          </label>
          <div className="row">
            <Search size={15} aria-hidden="true" />
            <input
              id="admin-player-search"
              className="input"
              type="search"
              placeholder="Name, role or nationality"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table admin-table">
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col">Team</th>
              <th scope="col">Role</th>
              <th scope="col">Nationality</th>
              <th scope="col">Status</th>
              <th scope="col" className="num">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => (
              <tr key={player.id}>
                <td>
                  <strong>{player.name}</strong>
                  {player.isCaptain && <span className="tag tag-captain" style={{ marginLeft: 6 }}>C</span>}
                  {player.jerseyNumber != null && <span className="tag" style={{ marginLeft: 6 }}>#{player.jerseyNumber}</span>}
                </td>
                <td>{teamsById[player.teamId]?.name ?? 'Unassigned'}</td>
                <td>{player.role ? ROLE_LABELS[player.role] : <span className="muted">Not verified</span>}</td>
                <td>{player.nationality ?? '\u2014'}</td>
                <td>
                  <span className={`badge ${player.verified ? 'badge-green' : 'badge-warn'}`}>
                    {player.verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setError(null)
                        setEditing({
                          ...BLANK,
                          ...player,
                          role: player.role ?? '',
                          jerseyNumber: player.jerseyNumber ?? '',
                        })
                      }}
                      aria-label={`Edit ${player.name}`}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleting(player)}
                      aria-label={`Delete ${player.name}`}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="small muted" style={{ marginTop: '0.8rem' }}>No players match these filters.</p>}

      <Modal
        open={Boolean(editing)}
        onClose={() => !busy && setEditing(null)}
        title={editing?.id ? `Edit ${editing.name}` : 'Add a player'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="player-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving\u2026' : 'Save player'}
            </button>
          </>
        }
      >
        {editing && (
          <form id="player-form" className="form" onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="player-name">
                  Full name *
                </label>
                <input id="player-name" className="input" required value={editing.name} onChange={update('name')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="player-team">
                  Team *
                </label>
                <select id="player-team" className="select" required value={editing.teamId} onChange={update('teamId')}>
                  <option value="">Choose a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {editing.teamId && teamsById[editing.teamId] && <TeamBadge team={teamsById[editing.teamId]} size="sm" />}
              </div>
              <div className="field">
                <label className="label" htmlFor="player-role">
                  Playing role
                </label>
                <select id="player-role" className="select" value={editing.role ?? ''} onChange={update('role')}>
                  <option value="">Not verified / leave blank</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="player-nationality">
                  Nationality
                </label>
                <input
                  id="player-nationality"
                  className="input"
                  value={editing.nationality ?? ''}
                  onChange={update('nationality')}
                  placeholder="e.g. Nepal"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="player-jersey">
                  Jersey number (verified only)
                </label>
                <input
                  id="player-jersey"
                  className="input"
                  type="number"
                  min="0"
                  max="99"
                  value={editing.jerseyNumber ?? ''}
                  onChange={update('jerseyNumber')}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="player-verified-date">
                  Last verified
                </label>
                <input
                  id="player-verified-date"
                  className="input"
                  type="date"
                  value={editing.lastVerified ?? ''}
                  onChange={update('lastVerified')}
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="player-bio">
                  Short biography (optional, sourced only)
                </label>
                <textarea
                  id="player-bio"
                  className="textarea"
                  value={editing.bio ?? ''}
                  onChange={update('bio')}
                  placeholder="Leave blank rather than guessing career details."
                />
              </div>
              <div className="field">
                <label className="checkbox-row" htmlFor="player-captain">
                  <input
                    id="player-captain"
                    type="checkbox"
                    checked={Boolean(editing.isCaptain)}
                    onChange={update('isCaptain')}
                  />
                  Team captain
                </label>
              </div>
              <div className="field">
                <label className="checkbox-row" htmlFor="player-verified">
                  <input
                    id="player-verified"
                    type="checkbox"
                    checked={Boolean(editing.verified)}
                    onChange={update('verified')}
                  />
                  Squad membership verified
                </label>
              </div>
              <div className="field-full">
                <ImageUploader
                  value={editing.imageUrl}
                  onChange={(url) => setEditing((current) => ({ ...current, imageUrl: url }))}
                  folder="players"
                  label="Player photo (only with permission)"
                />
              </div>
            </div>
            <FormError>{error}</FormError>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Remove ${deleting?.name ?? 'player'}?`}
        message="This removes the player from the squad. Existing scorecard rows that reference the player may also be removed depending on the database."
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  )
}
