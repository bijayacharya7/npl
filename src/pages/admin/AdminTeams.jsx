import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { ConfirmDialog, FormError, Modal, VerificationBadge } from '../../components/ui.jsx'
import { ImageUploader } from '../../components/ImageUploader.jsx'
import { TeamBadge } from '../../components/TeamBadge.jsx'
import { slugify } from '../../data/players.js'

const BLANK = {
  name: '',
  shortName: '',
  abbreviation: '',
  city: '',
  province: '',
  captain: '',
  headCoach: '',
  previousFinish: '',
  primaryColor: '#1b2a6b',
  accentColor: '#f5c542',
  description: '',
  imageUrl: null,
  lastVerified: '2026-10-22',
  source: { label: 'Admin entry', url: null },
}

export default function AdminTeams() {
  const { teams, store, refresh } = useData()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (field) => (event) => setEditing((current) => ({ ...current, [field]: event.target.value }))

  const save = async (event) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const payload = { ...editing, id: editing.id ?? slugify(editing.name) }
      await store.saveTeam(payload)
      await store.logActivity(editing.id ? 'Updated team' : 'Created team', 'teams', editing.name)
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
      await store.deleteTeam(deleting.id)
      await store.logActivity('Deleted team', 'teams', deleting.name)
      await refresh()
      toast.success('Team deleted.')
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
          <span className="eyebrow">Content</span>
          <h1>Teams &amp; coaches</h1>
          <p className="small muted">
            Team profile, captain, head coach and branding. Player squads live under Players &amp; staff.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setError(null)
            setEditing({ ...BLANK })
          }}
        >
          <Plus size={14} aria-hidden="true" />
          Add team
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table admin-table">
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">City</th>
              <th scope="col">Captain</th>
              <th scope="col">Head coach</th>
              <th scope="col">Source</th>
              <th scope="col" className="num">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td>
                  <div className="row" style={{ gap: '0.5rem' }}>
                    <TeamBadge team={team} size="sm" />
                    <span style={{ fontWeight: 600 }}>{team.name}</span>
                  </div>
                </td>
                <td>{team.city ?? '\u2014'}</td>
                <td>{team.captain ?? '\u2014'}</td>
                <td>{team.headCoach ?? '\u2014'}</td>
                <td>
                  <VerificationBadge verified={Boolean(team.lastVerified)} label={team.lastVerified ?? 'No date'} />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setError(null)
                        setEditing({ ...BLANK, ...team })
                      }}
                      aria-label={`Edit ${team.name}`}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleting(team)}
                      aria-label={`Delete ${team.name}`}
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

      <Modal
        open={Boolean(editing)}
        onClose={() => !busy && setEditing(null)}
        title={editing?.id ? `Edit ${editing.name}` : 'Add a team'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="team-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving\u2026' : 'Save team'}
            </button>
          </>
        }
      >
        {editing && (
          <form id="team-form" className="form" onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="team-name">
                  Team name *
                </label>
                <input id="team-name" className="input" required value={editing.name} onChange={update('name')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-short">
                  Short name
                </label>
                <input id="team-short" className="input" value={editing.shortName ?? ''} onChange={update('shortName')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-abbr">
                  Abbreviation *
                </label>
                <input
                  id="team-abbr"
                  className="input"
                  required
                  maxLength={4}
                  value={editing.abbreviation ?? ''}
                  onChange={update('abbreviation')}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-city">
                  City
                </label>
                <input id="team-city" className="input" value={editing.city ?? ''} onChange={update('city')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-province">
                  Province
                </label>
                <input id="team-province" className="input" value={editing.province ?? ''} onChange={update('province')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-captain">
                  Captain
                </label>
                <input id="team-captain" className="input" value={editing.captain ?? ''} onChange={update('captain')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-coach">
                  Head coach
                </label>
                <input id="team-coach" className="input" value={editing.headCoach ?? ''} onChange={update('headCoach')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-finish">
                  Previous season finish
                </label>
                <input
                  id="team-finish"
                  className="input"
                  value={editing.previousFinish ?? ''}
                  onChange={update('previousFinish')}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-primary">
                  Primary colour
                </label>
                <input
                  id="team-primary"
                  className="input"
                  type="color"
                  value={editing.primaryColor ?? '#1b2a6b'}
                  onChange={update('primaryColor')}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-accent">
                  Accent colour
                </label>
                <input
                  id="team-accent"
                  className="input"
                  type="color"
                  value={editing.accentColor ?? '#f5c542'}
                  onChange={update('accentColor')}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="team-verified">
                  Last verified
                </label>
                <input
                  id="team-verified"
                  className="input"
                  type="date"
                  value={editing.lastVerified ?? ''}
                  onChange={update('lastVerified')}
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="team-description">
                  Description
                </label>
                <textarea
                  id="team-description"
                  className="textarea"
                  value={editing.description ?? ''}
                  onChange={update('description')}
                  placeholder="A short, original description of the franchise. Do not copy text from other sites."
                />
              </div>
              <div className="field-full">
                <ImageUploader
                  value={editing.imageUrl}
                  onChange={(url) => setEditing((current) => ({ ...current, imageUrl: url }))}
                  folder="teams"
                  label="Team image (optional, licensed only)"
                />
              </div>
            </div>
            <FormError>{error}</FormError>
            <p className="help">
              Do not upload official franchise logos unless you have permission. The generated badge is used
              when no image is provided.
            </p>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? 'team'}?`}
        message="This also removes the team's players. Teams with fixtures cannot be deleted until those matches are reassigned or removed."
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  )
}
