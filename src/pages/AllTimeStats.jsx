import { Link } from 'react-router-dom'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { Seo, PageHeader } from '../components/ui.jsx'
import {
  ALL_TIME_RUNS,
  ALL_TIME_WICKETS,
  CHAMPIONS,
  RECORDS_AS_OF,
  RECORD_SOURCES,
  TOURNAMENT_RECORDS,
} from '../data/records.js'
import { useData } from '../context/DataContext.jsx'

function HistoricalLeaderboard({ title, rows, stat, statLabel, secondary, teamsById }) {
  return (
    <section className="card" aria-label={title}>
      <div className="card-head">
        <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
        <span className="badge badge-muted">Top {rows.length}</span>
      </div>
      <div className="leaderboard">
        {rows.map((row, index) => (
          <div className="leader-row" key={row.name}>
            <span className="leader-rank">{index + 1}</span>
            <TeamBadge team={Object.values(teamsById).find((team) => team.name === row.team)} size="sm" />
            <span className="leader-main">
              <span className="leader-name">{row.name}</span>
              <span className="leader-sub">{row.team}{secondary(row) ? ` · ${secondary(row)}` : ''}</span>
            </span>
            <span className="leader-value">{row[stat]}<span className="leader-unit">{statLabel}</span></span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AllTimeStats() {
  const { teamsById } = useData()

  return (
    <div className="container page">
      <Seo
        title="NPL all-time statistics"
        description="Nepal Premier League career records, all-time run scorers, wicket takers and champions through the 2025 season."
      />
      <PageHeader
        eyebrow="Historical tournament records"
        title="All-time NPL statistics"
        description="Career and tournament records through the end of the 2025 season."
        actions={<Link to="/stats" className="btn btn-outline btn-sm">View NPL 2026 stats</Link>}
      />

      <div className="section-head">
        <div>
          <span className="eyebrow">Seasons 1–2</span>
          <h2>NPL records</h2>
          <p className="small muted">Historical figures are separate from the live NPL 2026 scorecard statistics.</p>
        </div>
        <span className="badge badge-muted">{RECORDS_AS_OF}</span>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '1.2rem' }}>
        {TOURNAMENT_RECORDS.map((record) => (
          <article className="card card-pad" key={record.label}>
            <span className="tiny muted">{record.label}</span>
            <strong style={{ display: 'block', fontSize: '1.5rem', margin: '0.35rem 0' }}>{record.value}</strong>
            <span className="small muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {record.teamId && <TeamBadge team={teamsById[record.teamId]} size="sm" />}
              {record.detail}
            </span>
          </article>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1.2rem' }}>
        <HistoricalLeaderboard title="All-time run scorers" rows={ALL_TIME_RUNS} stat="runs" statLabel="runs" teamsById={teamsById} secondary={(row) => `${row.matches} matches · Avg ${row.average} · SR ${row.strikeRate}`} />
        <HistoricalLeaderboard title="All-time wicket takers" rows={ALL_TIME_WICKETS} stat="wickets" statLabel="wkts" teamsById={teamsById} secondary={() => ''} />
      </div>

      <section className="card" aria-labelledby="champions-heading">
        <div className="card-head"><h2 id="champions-heading" style={{ fontSize: '1.1rem' }}>NPL champions</h2><span className="badge badge-muted">Seasons 1–2</span></div>
        <div className="leaderboard">
          {CHAMPIONS.map((item) => (
            <div className="leader-row" key={item.season}>
              <span className="leader-rank">🏆</span>
              <span className="leader-main">
                <span className="leader-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TeamBadge team={teamsById[item.championId]} size="sm" />{item.champion}</span>
                <span className="leader-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>{item.season} · Runner-up: <TeamBadge team={teamsById[item.runnerUpId]} size="sm" />{item.runnerUp}</span>
              </span>
              <span className="leader-value" style={{ fontSize: '0.85rem' }}>{item.result}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="tiny muted" style={{ marginTop: '0.65rem' }}>
        Historical record sources:{' '}
        {RECORD_SOURCES.map((source, index) => (
          <span key={source.url}>{index > 0 ? ' · ' : ''}<a className="text-link" href={source.url} target="_blank" rel="noreferrer noopener">{source.label}</a></span>
        ))}
      </p>
    </div>
  )
}
