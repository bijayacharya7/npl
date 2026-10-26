import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { ConfirmDialog, FormError, Modal, TableSkeleton } from '../../components/ui.jsx'
import { StatusBadge } from '../../components/MatchCard.jsx'
import { TeamBadge } from '../../components/TeamBadge.jsx'
import { STAGE_LABELS, MATCH_STATUSES, STATUS_LABELS } from '../../data/matches.js'
import { formatDateTime } from '../../lib/format.js'

function toNptInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const shifted = new Date(date.getTime() + 5.75 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 16)
}

function fromNptInput(value) {
  return value ? `${value}:00+05:45` : ''
}

const BLANK_MATCH = {
  matchNo: '',
  stage: 'league',
  homeTeamId: '',
  awayTeamId: '',
  homeLabel: '',
  awayLabel: '',
  startTime: '',
  venue: 'Tribhuvan University International Cricket Ground, Kirtipur, Nepal',
  status: 'upcoming',
  statusNote: '',
  tossWinnerTeamId: '',
  tossDecision: '',
  resultType: '',
  winnerTeamId: '',
  resultMargin: '',
  resultSummary: '',
  playerOfMatchId: '',
  summary: '',
  innings: [],
}

const BLANK_SCORECARD = {
  kind: 'batting',
  playerId: '',
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  out: true,
  dismissal: '',
  overs: '0',
  maidens: 0,
  runsConceded: 0,
  wickets: 0,
  catches: 0,
  stumpings: 0,
}

export default function AdminMatches() {
  const { matches, teams, players, teamsById, playersById, scorecards, store, refresh, loading } = useData()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [scorecardMatch, setScorecardMatch] = useState(null)
  const [scoreForm, setScoreForm] = useState(BLANK_SCORECARD)
  const [searchParams] = useSearchParams()
  const openedEditRef = useRef(null)
  const editId = searchParams.get('edit')

  const filtered = useMemo(
    () =>
      matches.filter((match) => {
        if (statusFilter !== 'all' && match.status !== statusFilter) return false
        if (stageFilter === 'league' && match.stage !== 'league') return false
        if (stageFilter === 'playoffs' && match.stage === 'league') return false
        return true
      }),
    [matches, statusFilter, stageFilter],
  )

  useEffect(() => {
    if (!editId || openedEditRef.current === editId) return
    const match = matches.find((item) => item.id === editId)
    if (!match) return
    openedEditRef.current = editId
    setError(null)
    setEditing({
      ...BLANK_MATCH,
      ...match,
      startTime: toNptInput(match.startTime),
      tossWinnerTeamId: match.toss?.winnerTeamId ?? '',
      tossDecision: match.toss?.decision ?? '',
      resultType: match.result?.type ?? '',
      winnerTeamId: match.result?.winnerTeamId ?? '',
      resultMargin: match.result?.margin ?? '',
      resultSummary: match.result?.summary ?? '',
      innings: (match.innings ?? []).map((innings) => ({ ...innings, overs: String(innings.overs) })),
    })
  }, [editId, matches])

  const update = (field) => (event) => setEditing((current) => ({ ...current, [field]: event.target.value }))

  const openEditor = (match) => {
    setError(null)
    setEditing({
      ...BLANK_MATCH,
      ...match,
      startTime: toNptInput(match.startTime),
      tossWinnerTeamId: match.toss?.winnerTeamId ?? '',
      tossDecision: match.toss?.decision ?? '',
      resultType: match.result?.type ?? '',
      winnerTeamId: match.result?.winnerTeamId ?? '',
      resultMargin: match.result?.margin ?? '',
      resultSummary: match.result?.summary ?? '',
      innings: (match.innings ?? []).map((innings) => ({ ...innings, overs: String(innings.overs) })),
    })
  }

  const openNew = () => {
    setError(null)
    const nextNo = Math.max(0, ...matches.map((match) => match.matchNo)) + 1
    setEditing({
      ...BLANK_MATCH,
      matchNo: nextNo,
      startTime: toNptInput(new Date().toISOString()),
      innings: [],
    })
  }

  const setInnings = (index, field, value) => {
    setEditing((current) => {
      const next = [...current.innings]
      next[index] = { ...next[index], [field]: value }
      return { ...current, innings: next }
    })
  }

  const addInnings = () => {
    setEditing((current) => {
      const existing = new Set(current.innings.map((row) => row.teamId))
      const candidates = [current.homeTeamId, current.awayTeamId].filter((id) => id && !existing.has(id))
      return {
        ...current,
        innings: [
          ...current.innings,
          ...candidates.map((teamId) => ({ teamId, runs: 0, wickets: 0, overs: '20' })),
        ],
      }
    })
  }

  const save = async (event) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const payload = {
        ...editing,
        startTime: fromNptInput(editing.startTime),
        homeTeamId: editing.stage === 'league' ? editing.homeTeamId : editing.homeTeamId || null,
        awayTeamId: editing.stage === 'league' ? editing.awayTeamId : editing.awayTeamId || null,
        toss: editing.tossWinnerTeamId
          ? { winnerTeamId: editing.tossWinnerTeamId, decision: editing.tossDecision || null }
          : null,
        result: editing.resultType
          ? {
              type: editing.resultType,
              winnerTeamId: editing.winnerTeamId || null,
              margin: editing.resultMargin || null,
              summary: editing.resultSummary || null,
            }
          : null,
        innings: editing.innings
          .filter((innings) => innings.teamId && String(innings.runs) !== '')
          .map((innings) => ({
            ...innings,
            runs: Number(innings.runs) || 0,
            wickets: Number(innings.wickets) || 0,
            overs: String(innings.overs ?? '0'),
          })),
      }
      await store.saveMatch(payload)
      await store.logActivity(editing.id ? 'Updated match' : 'Created match', 'matches', `Match ${editing.matchNo}`)
      await refresh()
      toast.success('Match saved. Points table and statistics recalculated.')
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
      await store.deleteMatch(deleting.id)
      await store.logActivity('Deleted match', 'matches', `Match ${deleting.matchNo}`)
      await refresh()
      toast.success('Match deleted.')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openScorecard = (match) => {
    setScorecardMatch(match)
    setScoreForm({ ...BLANK_SCORECARD, playerId: '' })
  }

  const eligiblePlayers = scorecardMatch
    ? players.filter((player) =>
        scorecardMatch.homeTeamId || scorecardMatch.awayTeamId
          ? [scorecardMatch.homeTeamId, scorecardMatch.awayTeamId].includes(player.teamId)
          : true,
      )
    : []

  const currentRows =
    scorecardMatch && scorecards[scoreForm.kind]
      ? scorecards[scoreForm.kind].filter((row) => row.matchId === scorecardMatch.id)
      : []

  const saveScorecard = async (event) => {
    event.preventDefault()
    if (!scorecardMatch) return
    const player = playersById[scoreForm.playerId]
    if (!player) {
      toast.error('Choose a player first.')
      return
    }
    setBusy(true)
    try {
      const row = {
        id: scoreForm.id ?? crypto.randomUUID(),
        matchId: scorecardMatch.id,
        playerId: player.id,
        teamId: player.teamId,
        runs: scoreForm.runs,
        balls: scoreForm.balls,
        fours: scoreForm.fours,
        sixes: scoreForm.sixes,
        out: scoreForm.out,
        dismissal: scoreForm.dismissal,
        overs: scoreForm.overs,
        maidens: scoreForm.maidens,
        runsConceded: scoreForm.runsConceded,
        wickets: scoreForm.wickets,
        catches: scoreForm.catches,
        stumpings: scoreForm.stumpings,
      }
      await store.saveScorecard(scoreForm.kind, row)
      await store.logActivity('Saved scorecard row', scoreForm.kind, `${player.name} — match ${scorecardMatch.matchNo}`)
      await refresh()
      toast.success('Scorecard saved.')
      setScoreForm({ ...BLANK_SCORECARD, kind: scoreForm.kind })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteScorecardRow = async (kind, id) => {
    try {
      await store.deleteScorecard(kind, id)
      await refresh()
      toast.success('Scorecard row deleted.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">Match operations</span>
          <h1>Fixtures &amp; scores</h1>
          <p className="small muted">
            Record toss, innings, results and scorecards. Standings and leaderboards update automatically.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
          <Plus size={14} aria-hidden="true" />
          Add match
        </button>
      </div>

      <div className="row" style={{ marginBottom: '1rem', gap: '0.6rem' }}>
        <div className="field" style={{ minWidth: 170 }}>
          <label className="label" htmlFor="match-status-filter">
            Status
          </label>
          <select
            id="match-status-filter"
            className="select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {MATCH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 170 }}>
          <label className="label" htmlFor="match-stage-filter">
            Stage
          </label>
          <select
            id="match-stage-filter"
            className="select"
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            <option value="all">All stages</option>
            <option value="league">League stage</option>
            <option value="playoffs">Playoffs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="table-wrap">
          <table className="data-table admin-table">
            <thead>
              <tr>
                <th scope="col">Match</th>
                <th scope="col">Teams</th>
                <th scope="col">Start (NPT)</th>
                <th scope="col">Status</th>
                <th scope="col">Result</th>
                <th scope="col" className="num">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((match) => (
                <tr key={match.id}>
                  <td>
                    <strong>#{match.matchNo}</strong>
                    <div className="tiny muted">{STAGE_LABELS[match.stage]}</div>
                  </td>
                  <td>
                    {teamsById[match.homeTeamId]?.name ?? match.homeLabel ?? 'TBC'} v{' '}
                    {teamsById[match.awayTeamId]?.name ?? match.awayLabel ?? 'TBC'}
                  </td>
                  <td>{formatDateTime(match.startTime)}</td>
                  <td>
                    <StatusBadge status={match.status} />
                  </td>
                  <td className="small">
                    {match.result?.summary ?? (match.result?.winnerTeamId ? teamsById[match.result.winnerTeamId]?.name : '\u2014')}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openScorecard(match)}>
                        <ClipboardList size={13} aria-hidden="true" />
                        Scores
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditor(match)}>
                        <Pencil size={13} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleting(match)}
                        aria-label={`Delete match ${match.matchNo}`}
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
      )}

      {/* Match editor */}
      <Modal
        open={Boolean(editing)}
        onClose={() => !busy && setEditing(null)}
        title={editing?.id ? `Edit match ${editing.matchNo}` : 'Add a match'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="match-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving\u2026' : 'Save match'}
            </button>
          </>
        }
      >
        {editing && (
          <form id="match-form" className="form" onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="match-no">
                  Match number *
                </label>
                <input id="match-no" className="input" type="number" min="1" required value={editing.matchNo} onChange={update('matchNo')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="match-stage">
                  Stage *
                </label>
                <select id="match-stage" className="select" value={editing.stage} onChange={update('stage')}>
                  {Object.entries(STAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="match-home">
                  Home team {editing.stage === 'league' && '*'}
                </label>
                <select
                  id="match-home"
                  className="select"
                  required={editing.stage === 'league'}
                  value={editing.homeTeamId ?? ''}
                  onChange={update('homeTeamId')}
                >
                  <option value="">TBC</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {editing.homeTeamId && teamsById[editing.homeTeamId] && <TeamBadge team={teamsById[editing.homeTeamId]} size="sm" />}
              </div>
              <div className="field">
                <label className="label" htmlFor="match-away">
                  Away team {editing.stage === 'league' && '*'}
                </label>
                <select
                  id="match-away"
                  className="select"
                  required={editing.stage === 'league'}
                  value={editing.awayTeamId ?? ''}
                  onChange={update('awayTeamId')}
                >
                  <option value="">TBC</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {editing.awayTeamId && teamsById[editing.awayTeamId] && <TeamBadge team={teamsById[editing.awayTeamId]} size="sm" />}
              </div>
              {editing.stage !== 'league' && (
                <>
                  <div className="field">
                    <label className="label" htmlFor="match-home-label">
                      Home placeholder
                    </label>
                    <input id="match-home-label" className="input" value={editing.homeLabel ?? ''} onChange={update('homeLabel')} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="match-away-label">
                      Away placeholder
                    </label>
                    <input id="match-away-label" className="input" value={editing.awayLabel ?? ''} onChange={update('awayLabel')} />
                  </div>
                </>
              )}
              <div className="field">
                <label className="label" htmlFor="match-start">
                  Start time (NPT) *
                </label>
                <input
                  id="match-start"
                  className="input"
                  type="datetime-local"
                  required
                  value={editing.startTime}
                  onChange={update('startTime')}
                />
                <span className="help">Stored with the +05:45 Nepal offset.</span>
              </div>
              <div className="field">
                <label className="label" htmlFor="match-status">
                  Status
                </label>
                <select id="match-status" className="select" value={editing.status} onChange={update('status')}>
                  {MATCH_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="match-venue">
                  Venue
                </label>
                <input id="match-venue" className="input" value={editing.venue ?? ''} onChange={update('venue')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="match-toss-winner">
                  Toss winner
                </label>
                <select
                  id="match-toss-winner"
                  className="select"
                  value={editing.tossWinnerTeamId ?? ''}
                  onChange={update('tossWinnerTeamId')}
                >
                  <option value="">Not recorded</option>
                  {[editing.homeTeamId, editing.awayTeamId].filter(Boolean).map((teamId) => (
                    <option key={teamId} value={teamId}>
                      {teamsById[teamId]?.name ?? teamId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="match-toss-decision">
                  Toss decision
                </label>
                <select id="match-toss-decision" className="select" value={editing.tossDecision ?? ''} onChange={update('tossDecision')}>
                  <option value="">Not recorded</option>
                  <option value="bat">Chose to bat</option>
                  <option value="bowl">Chose to bowl</option>
                </select>
              </div>
            </div>

            <hr className="divider" />
            <h3 style={{ fontSize: '1.05rem' }}>Result</h3>
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="match-result-type">
                  Result type
                </label>
                <select id="match-result-type" className="select" value={editing.resultType ?? ''} onChange={update('resultType')}>
                  <option value="">No result entered</option>
                  <option value="win">Win</option>
                  <option value="tie">Tie</option>
                  <option value="no-result">No result</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="match-winner">
                  Winner
                </label>
                <select
                  id="match-winner"
                  className="select"
                  value={editing.winnerTeamId ?? ''}
                  onChange={update('winnerTeamId')}
                  disabled={editing.resultType !== 'win'}
                >
                  <option value="">Not applicable</option>
                  {[editing.homeTeamId, editing.awayTeamId].filter(Boolean).map((teamId) => (
                    <option key={teamId} value={teamId}>
                      {teamsById[teamId]?.name ?? teamId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="match-margin">
                  Margin
                </label>
                <input
                  id="match-margin"
                  className="input"
                  placeholder="e.g. 6 wickets"
                  value={editing.resultMargin ?? ''}
                  onChange={update('resultMargin')}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="match-pom">
                  Player of the match
                </label>
                <select
                  id="match-pom"
                  className="select"
                  value={editing.playerOfMatchId ?? ''}
                  onChange={update('playerOfMatchId')}
                >
                  <option value="">Not awarded</option>
                  {eligibleFor(players, editing).map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({teamsById[player.teamId]?.abbreviation ?? 'TBC'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="match-result-summary">
                  Result summary
                </label>
                <input
                  id="match-result-summary"
                  className="input"
                  placeholder="e.g. Lumbini Lions won by 6 wickets"
                  value={editing.resultSummary ?? ''}
                  onChange={update('resultSummary')}
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="match-note">
                  Public status note
                </label>
                <input
                  id="match-note"
                  className="input"
                  placeholder="Optional note shown on the match page"
                  value={editing.statusNote ?? ''}
                  onChange={update('statusNote')}
                />
              </div>
            </div>

            <hr className="divider" />
            <div className="spread">
              <h3 style={{ fontSize: '1.05rem' }}>Innings</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addInnings}>
                <Plus size={13} aria-hidden="true" />
                Add innings
              </button>
            </div>
            {editing.innings.length === 0 ? (
              <p className="small muted">
                No innings yet. Add both innings once play starts so the result and net run rate are
                calculated correctly.
              </p>
            ) : (
              <div className="stack" style={{ gap: '0.6rem' }}>
                {editing.innings.map((innings, index) => (
                  <div key={index} className="form-grid" style={{ alignItems: 'end', gap: '0.5rem' }}>
                    <div className="field">
                      <label className="label" htmlFor={`innings-team-${index}`}>
                        Batting team
                      </label>
                      <select
                        id={`innings-team-${index}`}
                        className="select"
                        value={innings.teamId}
                        onChange={(event) => setInnings(index, 'teamId', event.target.value)}
                      >
                        {[editing.homeTeamId, editing.awayTeamId].filter(Boolean).map((teamId) => (
                          <option key={teamId} value={teamId}>
                            {teamsById[teamId]?.name ?? teamId}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`innings-runs-${index}`}>
                        Runs
                      </label>
                      <input
                        id={`innings-runs-${index}`}
                        className="input"
                        type="number"
                        min="0"
                        value={innings.runs}
                        onChange={(event) => setInnings(index, 'runs', event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`innings-wickets-${index}`}>
                        Wickets
                      </label>
                      <input
                        id={`innings-wickets-${index}`}
                        className="input"
                        type="number"
                        min="0"
                        max="10"
                        value={innings.wickets}
                        onChange={(event) => setInnings(index, 'wickets', event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`innings-overs-${index}`}>
                        Overs
                      </label>
                      <input
                        id={`innings-overs-${index}`}
                        className="input"
                        placeholder="e.g. 19.4"
                        value={innings.overs}
                        onChange={(event) => setInnings(index, 'overs', event.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        setEditing((current) => ({
                          ...current,
                          innings: current.innings.filter((_, i) => i !== index),
                        }))
                      }
                      aria-label="Remove innings"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FormError>{error}</FormError>
          </form>
        )}
      </Modal>

      {/* Scorecard editor */}
      <Modal
        open={Boolean(scorecardMatch)}
        onClose={() => setScorecardMatch(null)}
        title={scorecardMatch ? `Scorecard — match ${scorecardMatch.matchNo}` : 'Scorecard'}
        size="lg"
      >
        {scorecardMatch && (
          <div className="stack">
            <p className="small muted">
              {teamsById[scorecardMatch.homeTeamId]?.name ?? scorecardMatch.homeLabel} v{' '}
              {teamsById[scorecardMatch.awayTeamId]?.name ?? scorecardMatch.awayLabel} &middot;{' '}
              {formatDateTime(scorecardMatch.startTime)}
            </p>

            <div className="tabs" role="tablist" aria-label="Scorecard type">
              {[
                { id: 'batting', label: 'Batting' },
                { id: 'bowling', label: 'Bowling' },
                { id: 'fielding', label: 'Fielding' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={scoreForm.kind === tab.id}
                  className={`tab ${scoreForm.kind === tab.id ? 'active' : ''}`}
                  onClick={() => setScoreForm({ ...BLANK_SCORECARD, kind: tab.id })}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form className="form" onSubmit={saveScorecard}>
              <div className="form-grid">
                <div className="field field-full">
                  <label className="label" htmlFor="score-player">
                    Player *
                  </label>
                  <select
                    id="score-player"
                    className="select"
                    required
                    value={scoreForm.playerId}
                    onChange={(event) => setScoreForm((current) => ({ ...current, playerId: event.target.value }))}
                  >
                    <option value="">Choose a player</option>
                    {eligiblePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({teamsById[player.teamId]?.abbreviation ?? 'TBC'})
                      </option>
                    ))}
                  </select>
                </div>

                {scoreForm.kind === 'batting' && (
                  <>
                    <NumberField id="bat-runs" label="Runs" value={scoreForm.runs} onChange={(v) => setScoreForm((c) => ({ ...c, runs: v }))} />
                    <NumberField id="bat-balls" label="Balls faced" value={scoreForm.balls} onChange={(v) => setScoreForm((c) => ({ ...c, balls: v }))} />
                    <NumberField id="bat-fours" label="Fours" value={scoreForm.fours} onChange={(v) => setScoreForm((c) => ({ ...c, fours: v }))} />
                    <NumberField id="bat-sixes" label="Sixes" value={scoreForm.sixes} onChange={(v) => setScoreForm((c) => ({ ...c, sixes: v }))} />
                    <div className="field">
                      <label className="label" htmlFor="bat-out">
                        Dismissed?
                      </label>
                      <select
                        id="bat-out"
                        className="select"
                        value={scoreForm.out ? 'yes' : 'no'}
                        onChange={(event) => setScoreForm((c) => ({ ...c, out: event.target.value === 'yes' }))}
                      >
                        <option value="yes">Out</option>
                        <option value="no">Not out</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="bat-dismissal">
                        Dismissal
                      </label>
                      <input
                        id="bat-dismissal"
                        className="input"
                        placeholder="e.g. caught by Ram"
                        value={scoreForm.dismissal}
                        onChange={(event) => setScoreForm((c) => ({ ...c, dismissal: event.target.value }))}
                      />
                    </div>
                  </>
                )}

                {scoreForm.kind === 'bowling' && (
                  <>
                    <div className="field">
                      <label className="label" htmlFor="bowl-overs">
                        Overs
                      </label>
                      <input
                        id="bowl-overs"
                        className="input"
                        placeholder="e.g. 3.4"
                        value={scoreForm.overs}
                        onChange={(event) => setScoreForm((c) => ({ ...c, overs: event.target.value }))}
                      />
                    </div>
                    <NumberField id="bowl-maidens" label="Maidens" value={scoreForm.maidens} onChange={(v) => setScoreForm((c) => ({ ...c, maidens: v }))} />
                    <NumberField id="bowl-runs" label="Runs conceded" value={scoreForm.runsConceded} onChange={(v) => setScoreForm((c) => ({ ...c, runsConceded: v }))} />
                    <NumberField id="bowl-wickets" label="Wickets" value={scoreForm.wickets} onChange={(v) => setScoreForm((c) => ({ ...c, wickets: v }))} />
                  </>
                )}

                {scoreForm.kind === 'fielding' && (
                  <>
                    <NumberField id="field-catches" label="Catches" value={scoreForm.catches} onChange={(v) => setScoreForm((c) => ({ ...c, catches: v }))} />
                    <NumberField id="field-stumpings" label="Stumpings" value={scoreForm.stumpings} onChange={(v) => setScoreForm((c) => ({ ...c, stumpings: v }))} />
                  </>
                )}
              </div>

              <div className="row">
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                  {busy ? 'Saving\u2026' : scoreForm.id ? 'Update row' : 'Add to scorecard'}
                </button>
                {scoreForm.id && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setScoreForm({ ...BLANK_SCORECARD, kind: scoreForm.kind })}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <hr className="divider" />
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th scope="col">Player</th>
                    <th scope="col">Details</th>
                    <th scope="col" className="num">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted small">
                        No {scoreForm.kind} rows for this match yet.
                      </td>
                    </tr>
                  ) : (
                    currentRows.map((row) => (
                      <tr key={row.id}>
                        <td>{playersById[row.playerId]?.name ?? row.playerId}</td>
                        <td className="small">
                          {scoreForm.kind === 'batting' &&
                            `${row.runs} (${row.balls}b), ${row.fours}x4, ${row.sixes}x6, ${row.out ? 'out' : 'not out'}`}
                          {scoreForm.kind === 'bowling' &&
                            `${row.overs} ov, ${row.maidens} m, ${row.runsConceded} r, ${row.wickets} w`}
                          {scoreForm.kind === 'fielding' && `${row.catches} catches, ${row.stumpings} stumpings`}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setScoreForm({ ...BLANK_SCORECARD, ...row, kind: scoreForm.kind })}
                            >
                              <Pencil size={12} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteScorecardRow(scoreForm.kind, row.id)}
                              aria-label="Delete scorecard row"
                            >
                              <Trash2 size={12} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="tiny muted">
              Tip: add the innings totals under Edit first, then enter individual batting and bowling rows
              here. Aggregate statistics are recalculated after every save.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete match ${deleting?.matchNo ?? ''}?`}
        message="This removes the fixture, its innings and any linked scorecard rows. The standings will recalculate."
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  )
}

function NumberField({ id, label, value, onChange }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function eligibleFor(players, match) {
  if (!match.homeTeamId && !match.awayTeamId) return players
  return players.filter((player) => [match.homeTeamId, match.awayTeamId].includes(player.teamId))
}
