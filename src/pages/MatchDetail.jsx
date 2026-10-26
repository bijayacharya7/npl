import { Link, useParams } from 'react-router-dom'
import { Activity, CalendarDays, MapPin, Pencil, Radio, Trophy } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Seo, EmptyState, LoadingBlock, PageHeader, DataNote } from '../components/ui.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { StatusBadge } from '../components/MatchCard.jsx'
import { Countdown } from '../components/Countdown.jsx'
import { STAGE_LABELS } from '../data/matches.js'
import { formatDateTime, formatLongDate } from '../lib/format.js'

const DECISION_LABELS = { bat: 'chose to bat', bowl: 'chose to bowl' }

export default function MatchDetail() {
  const { matchId } = useParams()
  const { matchesById, teamsById, playersById, scorecards, loading } = useData()
  const { user } = useAuth()
  const match = matchesById[matchId]
  const isLive = match?.status === 'live'
  if (loading) {
    return (
      <div className="container page">
        <LoadingBlock label="Loading match" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="container page">
        <Seo title="Match not found" noIndex />
        <EmptyState title="Match not found">
          <Link to="/fixtures" className="text-link">
            Back to fixtures
          </Link>
        </EmptyState>
      </div>
    )
  }

  const home = match.homeTeamId ? teamsById[match.homeTeamId] : null
  const away = match.awayTeamId ? teamsById[match.awayTeamId] : null
  const homeInnings = match.innings?.find((innings) => innings.teamId === match.homeTeamId)
  const awayInnings = match.innings?.find((innings) => innings.teamId === match.awayTeamId)
  const battingRows = scorecards.batting.filter((row) => row.matchId === match.id)
  const bowlingRows = scorecards.bowling.filter((row) => row.matchId === match.id)
  const liveDetails = match.liveDetails
  const isUpcoming = match.status === 'upcoming'
  const tossTeam = match.toss?.winnerTeamId ? teamsById[match.toss.winnerTeamId] : null

  const scoreFor = (teamId) => match.innings?.find((innings) => innings.teamId === teamId)

  return (
    <div className="container page">
      <Seo
        title={`${home?.name ?? match.homeLabel} vs ${away?.name ?? match.awayLabel} — Match ${match.matchNo}`}
        description={`${STAGE_LABELS[match.stage]} match ${match.matchNo} of NPL 2026 at ${match.venue}. Date, start time, toss, scorecard and result as verified.`}
      />
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Fixtures', to: '/fixtures' },
          { label: `Match ${match.matchNo}` },
        ]}
      />

      <section className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div className="match-card-top" style={{ padding: '0.8rem 1.25rem' }}>
          <span>
            {STAGE_LABELS[match.stage]} &middot; Match {match.matchNo} &middot;{' '}
            {formatLongDate(match.startTime)}
          </span>
          <StatusBadge status={match.status} liveConfirmed={match.liveConfirmed} statusSource={match.statusSource} />
        </div>
        <div className="card-body">
          <div className="match-versus-teams match-detail-teams" style={{ maxWidth: 720, marginInline: 'auto' }}>
            <div className="match-detail-team">
              <TeamBadge team={home} size="xl" />
              <div className="match-detail-team-copy">
                <h2>{home?.name ?? match.homeLabel}</h2>
                <p className="small muted">{home?.abbreviation ?? 'TBC'}</p>
                {homeInnings && (
                  <p className="match-detail-score">
                    {homeInnings.runs}
                    {Number(homeInnings.wickets) >= 10 ? '' : `/${homeInnings.wickets}`}
                    <span className="tiny muted" style={{ marginLeft: 5 }}>({homeInnings.overs} ov)</span>
                  </p>
                )}
              </div>
            </div>
            <div className="match-detail-versus">
              <span className="hero-vs">VS</span>
              <p className="tiny muted" style={{ marginTop: '0.3rem' }}>
                {formatDateTime(match.startTime)}
              </p>
            </div>
            <div className="match-detail-team match-detail-team-away">
              <TeamBadge team={away} size="xl" />
              <div className="match-detail-team-copy">
                <h2>{away?.name ?? match.awayLabel}</h2>
                <p className="small muted">{away?.abbreviation ?? 'TBC'}</p>
                {awayInnings && (
                  <p className="match-detail-score">
                    {awayInnings.runs}
                    {Number(awayInnings.wickets) >= 10 ? '' : `/${awayInnings.wickets}`}
                    <span className="tiny muted" style={{ marginLeft: 5 }}>({awayInnings.overs} ov)</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {match.result?.summary && (
            <div className="notice notice-green" style={{ marginTop: '1.4rem', justifyContent: 'center' }}>
              <Trophy size={16} aria-hidden="true" />
              <strong>{match.result.summary}</strong>
            </div>
          )}

          {isUpcoming && (
            <div style={{ maxWidth: 480, margin: '1.3rem auto 0' }}>
              <Countdown target={match.startTime} />
              <p className="tiny muted" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                Countdown uses Nepal Standard Time (UTC+05:45). Live scores and ball-by-ball updates
                will start automatically when the match is live.
              </p>
            </div>
          )}

          <div className="row" style={{ justifyContent: 'center', marginTop: '1.3rem', flexWrap: 'wrap', gap: '0.6rem' }}>
            {isLive && (
              <span className="btn btn-sm btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', pointerEvents: 'none' }}>
                <Activity size={14} />
                {match.statusSource === 'schedule' ? 'LIVE · SCORE FEED CONNECTING' : 'MATCH IS LIVE'}
              </span>
            )}

            {user?.isAdmin && (
              <Link to={`/admin/matches?edit=${match.id}`} className="btn btn-ghost btn-sm">
                <Pencil size={13} aria-hidden="true" />
                Edit match
              </Link>
            )}
          </div>
        </div>
      </section>

      {liveDetails && (
        <section className="card" aria-labelledby="live-update-heading" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="row" style={{ gap: '0.55rem' }}>
              <Activity size={16} aria-hidden="true" />
              <h2 id="live-update-heading" style={{ fontSize: '1.05rem' }}>{match.status === 'live' ? 'Live match updates' : 'Match updates'}</h2>
            </div>
            <span className="tiny muted">
              via {liveDetails.source} · updated {formatDateTime(liveDetails.updatedAt)} NPT
            </span>
          </div>
          <div className="card-body stack" style={{ gap: '1rem' }}>
            {liveDetails.statusNote && <p className="small"><strong>{liveDetails.statusNote}</strong></p>}
            <div className="grid grid-2">
              <div>
                <h3 className="tiny muted" style={{ marginBottom: '0.45rem' }}>{match.status === 'live' ? 'At the crease' : 'Last batters'}</h3>
                {liveDetails.currentBatters?.length ? liveDetails.currentBatters.map((row) => (
                  <p className="small" key={row.playerId}>
                    <strong>{row.playerName}</strong> {row.runs} ({row.balls}) · {row.fours} fours · {row.sixes} sixes
                  </p>
                )) : <p className="small muted">Batter details are being updated.</p>}
              </div>
              <div>
                <h3 className="tiny muted" style={{ marginBottom: '0.45rem' }}>{match.status === 'live' ? 'Bowling' : 'Last bowling figures'}</h3>
                {liveDetails.currentBowlers?.length ? liveDetails.currentBowlers.map((row) => (
                  <p className="small" key={row.playerId}>
                    <strong>{row.playerName}</strong> {row.overs}-{row.maidens}-{row.runsConceded}-{row.wickets}
                  </p>
                )) : <p className="small muted">Bowler details are being updated.</p>}
              </div>
            </div>
            {liveDetails.commentary?.length > 0 && (
              <div>
                <h3 className="tiny muted" style={{ marginBottom: '0.45rem' }}>Recent balls</h3>
                <ol className="stack" style={{ gap: '0.35rem', paddingLeft: '1.25rem', margin: 0 }}>
                  {liveDetails.commentary.slice(0, 8).map((ball) => (
                    <li className="small" key={ball.id}>{ball.over}.{ball.ball} · {ball.text}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="split">

        <div className="stack">
          <section aria-labelledby="scorecard-heading">
            <div className="section-head" style={{ marginBottom: '0.8rem' }}>
              <div>
                <span className="eyebrow">Match centre</span>
                <h2 id="scorecard-heading" style={{ fontSize: '1.7rem' }}>
                  Scorecard
                </h2>
              </div>
            </div>

            {match.innings?.length === 0 || !match.innings ? (
              <EmptyState title="Scorecard not available yet" icon={Radio}>
                {match.status === 'live' ? (
                  match.statusSource === 'schedule' ? (
                    <>The verified fixture time places this match in its live window. Scores will appear when a live data source confirms them.</>
                  ) : (
                    <>This match is live, but a verified scorecard has not been received yet.</>
                  )
                ) : (
                  <>
                    No innings have been recorded. Scores appear only after a verified result is entered in
                    the admin dashboard &mdash; we never fabricate them.
                  </>
                )}
              </EmptyState>
            ) : (
              <div className="stack" style={{ gap: '1.2rem' }}>
                {match.innings.map((innings) => {
                  const battingTeam = teamsById[innings.teamId]
                  const rows = battingRows.filter((row) => row.teamId === innings.teamId)
                  const bowlers = bowlingRows.filter((row) => row.teamId !== innings.teamId)
                  return (
                    <div className="card" key={innings.id ?? innings.teamId}>
                      <div className="card-head">
                        <div className="row" style={{ gap: '0.6rem' }}>
                          <TeamBadge team={battingTeam} size="sm" />
                          <h3>{battingTeam?.name ?? 'Innings'}</h3>
                        </div>
                        <span className="badge badge-gold">
                          {innings.runs}
                          {Number(innings.wickets) >= 10 ? '' : `/${innings.wickets}`} ({innings.overs} ov)
                        </span>
                      </div>
                      {rows.length === 0 && bowlers.length === 0 ? (
                        <div className="card-body">
                          <p className="small muted">
                            Innings total recorded, but the ball-by-ball batting and bowling details have not
                            been entered yet.
                          </p>
                        </div>
                      ) : (
                        <div className="table-wrap">
                          <table className="data-table">
                            <caption className="sr-only">
                              Batting and bowling details for {battingTeam?.name ?? 'this innings'}
                            </caption>
                            <thead>
                              <tr>
                                <th scope="col">Batter</th>
                                <th scope="col" className="num">
                                  R
                                </th>
                                <th scope="col" className="num">
                                  B
                                </th>
                                <th scope="col" className="num">
                                  4s
                                </th>
                                <th scope="col" className="num">
                                  6s
                                </th>
                                <th scope="col" className="num">
                                  SR
                                </th>
                                <th scope="col">Dismissal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row) => (
                                <tr key={row.id ?? row.playerId}>
                                  <td>
                                    {playersById[row.playerId] ? (
                                      <Link to={`/players/${row.playerId}`} style={{ fontWeight: 600 }}>
                                        {playersById[row.playerId].name}
                                      </Link>
                                    ) : <strong>{row.playerName ?? row.playerId}</strong>}
                                  </td>
                                  <td className="num">{row.runs}</td>
                                  <td className="num">{row.balls}</td>
                                  <td className="num">{row.fours}</td>
                                  <td className="num">{row.sixes}</td>
                                  <td className="num">
                                    {row.balls > 0 ? ((row.runs / row.balls) * 100).toFixed(2) : '\u2014'}
                                  </td>
                                  <td className="muted small">{row.out ? row.dismissal || 'out' : 'not out'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {bowlers.length > 0 && (
                        <div className="table-wrap" style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th scope="col">Bowler</th>
                                <th scope="col" className="num">
                                  O
                                </th>
                                <th scope="col" className="num">
                                  M
                                </th>
                                <th scope="col" className="num">
                                  R
                                </th>
                                <th scope="col" className="num">
                                  W
                                </th>
                                <th scope="col" className="num">
                                  Econ
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bowlers.map((row) => (
                                <tr key={row.id ?? `${row.playerId}-${innings.id}`}>
                                  <td>
                                    {playersById[row.playerId] ? (
                                      <Link to={`/players/${row.playerId}`} style={{ fontWeight: 600 }}>
                                        {playersById[row.playerId].name}
                                      </Link>
                                    ) : <strong>{row.playerName ?? row.playerId}</strong>}
                                  </td>
                                  <td className="num">{row.overs}</td>
                                  <td className="num">{row.maidens}</td>
                                  <td className="num">{row.runsConceded}</td>
                                  <td className="num">{row.wickets}</td>
                                  <td className="num">
                                    {Number(row.overs) > 0
                                      ? (row.runsConceded / Math.max(1, Math.floor(Number(row.overs)) + ((Number(row.overs) % 1) * 10) / 6)).toFixed(2)
                                      : '\u2014'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card-head">
              <h3>Match information</h3>
            </div>
            <div className="card-body">
              <table className="data-table" style={{ minWidth: 0 }}>
                <tbody>
                  <tr>
                    <td className="muted">Stage</td>
                    <td>{STAGE_LABELS[match.stage]}</td>
                  </tr>
                  <tr>
                    <td className="muted">Match</td>
                    <td>#{match.matchNo}</td>
                  </tr>
                  <tr>
                    <td className="muted">Date</td>
                    <td>{formatLongDate(match.startTime)}</td>
                  </tr>
                  <tr>
                    <td className="muted">Start</td>
                    <td>{formatDateTime(match.startTime)} NPT</td>
                  </tr>
                  <tr>
                    <td className="muted">Venue</td>
                    <td>{match.venue}</td>
                  </tr>
                  <tr>
                    <td className="muted">Toss</td>
                    <td>
                      {match.toss
                        ? `${tossTeam?.name ?? 'Team'} ${DECISION_LABELS[match.toss.decision] ?? ''}`
                        : 'Not recorded'}
                    </td>
                  </tr>
                  <tr>
                    <td className="muted">Player of the match</td>
                    <td>
                      {match.playerOfMatchId ? (
                        <Link to={`/players/${match.playerOfMatchId}`} className="text-link">
                          {playersById[match.playerOfMatchId]?.name ?? match.playerOfMatchId}
                        </Link>
                      ) : (
                        'Not awarded yet'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="muted">Status</td>
                    <td>
                      <StatusBadge status={match.status} liveConfirmed={match.liveConfirmed} statusSource={match.statusSource} />
                    </td>
                  </tr>
                </tbody>
              </table>
              {match.statusNote && <p className="tiny muted" style={{ marginTop: '0.7rem' }}>{match.statusNote}</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Data &amp; sources</h3>
            </div>
            <div className="card-body stack" style={{ gap: '0.6rem' }}>
              <p className="tiny muted">
                <CalendarDays size={12} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                Last updated: {formatDateTime(match.updatedAt ?? match.startTime)}
              </p>
              <p className="tiny muted">
                <MapPin size={12} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                {match.venue}
              </p>
              {match.source?.url ? (
                <a className="text-link small" href={match.source.url} target="_blank" rel="noreferrer noopener">
                  Fixture source: {match.source.label}
                </a>
              ) : (
                <p className="tiny muted">Source: {match.source?.label ?? 'admin entry'}</p>
              )}
              {match.summary && <p className="small">{match.summary}</p>}
            </div>
          </div>

          <DataNote variant="gold">
            <span className="tiny">
              {match.dataSourceLabel ? (
                <><strong>Scorecard via {match.dataSourceLabel}.</strong> Live match data refreshes automatically and may be delayed by the source.</>
              ) : match.status === 'live' ? (
                <><strong>Live score feed pending.</strong> No score has been received from a data source yet.</>
              ) : (
                <><strong>Score source.</strong> Figures come from the administrator or a connected score provider.</>
              )}
            </span>
          </DataNote>
        </aside>
      </div>
    </div>
  )
}
