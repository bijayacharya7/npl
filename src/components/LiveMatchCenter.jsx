import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Flame,
  Play,
  Pause,
  RefreshCw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'
import { TeamBadge } from './TeamBadge.jsx'

/**
 * Interactive Real-Time Match Center with live score, current batsmen,
 * active bowler, ball-by-ball over tracker, commentary feed, and live simulation controls.
 */

const SAMPLE_COMMENTARY_BANK = [
  { ball: '17.1', text: 'Full toss outside off, driven powerfully through extra cover for a boundary!', runs: 4, type: 'four' },
  { ball: '17.2', text: 'Good length delivery drifting in, tucked away toward deep midwicket for a sharp single.', runs: 1, type: 'single' },
  { ball: '17.3', text: 'Slower ball out of the back of the hand, swing and a miss! Excellent deception from the bowler.', runs: 0, type: 'dot' },
  { ball: '17.4', text: 'OUT! CAUGHT! Looped up, batter mistimes the lofted drive and it is taken cleanly at long-off! Huge breakthrough!', runs: 0, type: 'wicket' },
  { ball: '17.5', text: 'New batter gets off the mark straight away with a soft touch to third man.', runs: 1, type: 'single' },
  { ball: '17.6', text: 'SIX! Monster hit! Down the pitch, caught right out of the middle, sails 92 meters over long-on!', runs: 6, type: 'six' },
  { ball: '18.1', text: 'Yorker right in the blockhole! Jammed down into the pitch, batters scamper for a quick single.', runs: 1, type: 'single' },
  { ball: '18.2', text: 'Short and wide, carved over point! Two runs taken with desperate running between the wickets.', runs: 2, type: 'two' },
  { ball: '18.3', text: 'Sharp bouncer! Batter ducks under it safely. Dot ball.', runs: 0, type: 'dot' },
  { ball: '18.4', text: 'FOUR! Smashed down the ground past the non-striker! The outfield at Kirtipur is lightning quick.', runs: 4, type: 'four' },
  { ball: '18.5', text: 'OUT! CLEAN BOWLED! 142 km/h yorker rattles the middle and leg stumps! Uprooted!', runs: 0, type: 'wicket' },
  { ball: '18.6', text: 'Full on off stump, pushed into the gap at covers to finish the 19th over with a single.', runs: 1, type: 'single' },
]

export function LiveMatchCenter({ match, teamsById }) {
  const home = teamsById[match?.homeTeamId]
  const away = teamsById[match?.awayTeamId]

  // Live state
  const [isSimulating, setIsSimulating] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [ballIndex, setBallIndex] = useState(0)

  // Initial simulated live innings state
  const [liveState, setLiveState] = useState({
    battingTeamId: match?.homeTeamId ?? 'biratnagar-kings',
    bowlingTeamId: match?.awayTeamId ?? 'chitwan-rhinos',
    runs: 154,
    wickets: 4,
    overs: 17.2,
    striker: { name: 'Andre Russell', runs: 28, balls: 14, fours: 2, sixes: 3, strikeRate: '200.0' },
    nonStriker: { name: 'Lokesh Bam', runs: 34, balls: 26, fours: 3, sixes: 1, strikeRate: '130.7' },
    bowler: { name: 'Kushal Malla', overs: 3.2, maidens: 0, runs: 26, wickets: 2, economy: '7.8' },
    partnership: { runs: 42, balls: 22 },
    recentBalls: ['1', '4', '0', 'W', '1', '6', '1'],
    target: 182,
    crr: '8.88',
    rrr: '10.50',
    commentary: [
      { ball: '17.2', text: 'Full on the pads, worked through midwicket for a sharp single. Russell moves to 28.', runs: 1, type: 'single' },
      { ball: '17.1', text: 'Short pitched outside off, slashed over point for a roaring FOUR!', runs: 4, type: 'four' },
      { ball: '16.6', text: 'Good length ball on middle, pushed to cover for no run.', runs: 0, type: 'dot' },
      { ball: '16.5', text: 'WICKET! Slower delivery outside off, lofted straight down long-on’s throat! Basir Ahamad departs!', runs: 0, type: 'wicket' },
    ],
  })

  // Play audio chime if sound is enabled
  const playChime = (type) => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'six') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
      } else if (type === 'wicket') {
        osc.frequency.setValueAtTime(220, ctx.currentTime) // A3
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2) // A2
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
      }
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
    } catch {
      // AudioContext fallback
    }
  }

  // Next ball simulation step
  const advanceBall = () => {
    const nextEvent = SAMPLE_COMMENTARY_BANK[ballIndex % SAMPLE_COMMENTARY_BANK.length]
    setBallIndex((prev) => prev + 1)

    setLiveState((curr) => {
      const newRuns = curr.runs + nextEvent.runs
      const newWickets = nextEvent.type === 'wicket' ? curr.wickets + 1 : curr.wickets

      // Calculate overs
      const currentTotalBalls = Math.floor(curr.overs) * 6 + Math.round((curr.overs % 1) * 10) + 1
      const newOvers = Number((Math.floor(currentTotalBalls / 6) + (currentTotalBalls % 6) / 10).toFixed(1))

      // Update striker
      const updatedStriker = {
        ...curr.striker,
        runs: curr.striker.runs + nextEvent.runs,
        balls: curr.striker.balls + (nextEvent.type !== 'wide' ? 1 : 0),
        fours: nextEvent.type === 'four' ? curr.striker.fours + 1 : curr.striker.fours,
        sixes: nextEvent.type === 'six' ? curr.striker.sixes + 1 : curr.striker.sixes,
      }
      updatedStriker.strikeRate = ((updatedStriker.runs / Math.max(updatedStriker.balls, 1)) * 100).toFixed(1)

      const ballChip =
        nextEvent.type === 'wicket'
          ? 'W'
          : nextEvent.type === 'six'
            ? '6'
            : nextEvent.type === 'four'
              ? '4'
              : String(nextEvent.runs)

      const updatedRecent = [...curr.recentBalls.slice(-7), ballChip]

      const crr = ((newRuns / Math.max(currentTotalBalls, 1)) * 6).toFixed(2)
      const ballsRemaining = Math.max(120 - currentTotalBalls, 1)
      const runsNeeded = Math.max(curr.target - newRuns, 0)
      const rrr = ((runsNeeded / ballsRemaining) * 6).toFixed(2)

      playChime(nextEvent.type)

      return {
        ...curr,
        runs: newRuns,
        wickets: newWickets,
        overs: newOvers,
        striker: nextEvent.type === 'wicket' ? { name: 'Pratish GC', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: '0.0' } : updatedStriker,
        partnership: { runs: curr.partnership.runs + nextEvent.runs, balls: curr.partnership.balls + 1 },
        recentBalls: updatedRecent,
        crr,
        rrr,
        commentary: [nextEvent, ...curr.commentary.slice(0, 15)],
      }
    })
  }

  // Automatic timer for live simulation
  useEffect(() => {
    let interval = null
    if (isSimulating) {
      interval = setInterval(() => {
        advanceBall()
      }, 4000)
    }
    return () => clearInterval(interval)
  }, [isSimulating, ballIndex])

  const battingTeam = teamsById[liveState.battingTeamId] || home
  const bowlingTeam = teamsById[liveState.bowlingTeamId] || away

  return (
    <div className="live-match-center card" style={{ overflow: 'hidden', border: '1px solid var(--accent, #f5c542)' }}>
      {/* Live Header Banner */}
      <div
        className="live-header-banner"
        style={{
          background: 'linear-gradient(90deg, #1b0a0e 0%, #290d15 100%)',
          padding: '0.8rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.8rem',
          borderBottom: '1px solid rgba(245, 197, 66, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {match?.status === 'live' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#e63946',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 0 12px rgba(230, 57, 70, 0.65)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#fff',
                  animation: 'pulse 1.4s infinite ease-in-out',
                }}
              />
              LIVE NOW
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(245, 197, 66, 0.18)',
                color: '#f5c542',
                border: '1px solid rgba(245, 197, 66, 0.45)',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: '999px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
              title="This game is upcoming. Real-time scoring simulation is active for demo and testing."
            >
              DEMO SIMULATOR PREVIEW
            </span>
          )}
          <span className="small muted">
            TU Cricket Ground, Kirtipur &middot; NPL 2026 Match #{match?.matchNo ?? '1'}
          </span>
        </div>


        {/* Live Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`btn btn-sm ${isSimulating ? 'btn-danger' : 'btn-primary'}`}
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            title={isSimulating ? 'Pause live stream simulation' : 'Start live stream simulation'}
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            {isSimulating ? 'Pause Stream' : 'Live Stream'}
          </button>
          <button
            type="button"
            onClick={advanceBall}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            title="Simulate Next Ball"
          >
            <Zap size={13} /> Next Ball
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="icon-btn"
            style={{ width: 28, height: 28 }}
            title={soundEnabled ? 'Mute crowd chime' : 'Enable audio chime on boundaries/wickets'}
          >
            {soundEnabled ? <Volume2 size={14} color="#f5c542" /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {/* Main Scoreboard Board */}
      <div className="card-body" style={{ padding: '1.4rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1.5rem',
            alignItems: 'center',
          }}
        >
          {/* Team 1 Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <TeamBadge team={battingTeam} size="xl" />
            <div>
              <span className="eyebrow" style={{ color: 'var(--accent, #f5c542)' }}>
                Batting &bull; 2nd Innings
              </span>
              <h2 style={{ fontSize: '1.6rem', margin: '2px 0' }}>{battingTeam?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--display)',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#fff',
                  }}
                >
                  {liveState.runs}/{liveState.wickets}
                </span>
                <span className="muted" style={{ fontSize: '1.1rem' }}>
                  ({liveState.overs} / 20 ov)
                </span>
              </div>
            </div>
          </div>

          {/* Equation & Target */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '1rem 1.2rem',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#f5c542' }}>
              Need {Math.max(liveState.target - liveState.runs, 0)} runs from{' '}
              {Math.max(120 - (Math.floor(liveState.overs) * 6 + Math.round((liveState.overs % 1) * 10)), 0)} balls
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                marginTop: '0.4rem',
                fontSize: '0.82rem',
              }}
            >
              <span className="muted">
                CRR: <strong style={{ color: '#fff' }}>{liveState.crr}</strong>
              </span>
              <span className="muted">
                RRR: <strong style={{ color: '#f5c542' }}>{liveState.rrr}</strong>
              </span>
              <span className="muted">
                Target: <strong style={{ color: '#fff' }}>{liveState.target}</strong>
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
                marginTop: '0.8rem',
              }}
            >
              <div
                style={{
                  width: `${Math.min((liveState.runs / liveState.target) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f5c542, #ff8400)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Balls Over Ticker */}
        <div
          style={{
            marginTop: '1.2rem',
            padding: '0.7rem 1rem',
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.8rem',
          }}
        >
          <span className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current Over Balls:
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {liveState.recentBalls.map((b, i) => {
              const isW = b === 'W'
              const is6 = b === '6'
              const is4 = b === '4'
              const bg = isW
                ? '#e63946'
                : is6
                  ? '#7209b7'
                  : is4
                    ? '#2a9d8f'
                    : b === '0'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(245, 197, 66, 0.25)'
              const color = isW || is6 || is4 ? '#fff' : '#f5c542'
              return (
                <span
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: bg,
                    color,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    boxShadow: is6 || isW ? '0 0 8px rgba(0,0,0,0.5)' : 'none',
                  }}
                >
                  {b}
                </span>
              )
            })}
          </div>
        </div>

        {/* Live Batsmen & Active Bowler Cards */}
        <div
          style={{
            marginTop: '1.2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1rem',
          }}
        >
          {/* Batsmen on crease */}
          <div
            style={{
              padding: '0.9rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Batters at the crease
            </span>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {/* Striker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#f5c542' }}>&bull;</span> {liveState.striker.name} *
                </span>
                <span style={{ fontFamily: 'var(--display)', fontSize: '0.95rem' }}>
                  <strong>{liveState.striker.runs}</strong>{' '}
                  <span className="muted tiny">
                    ({liveState.striker.balls}b, {liveState.striker.fours}x4, {liveState.striker.sixes}x6, SR:{' '}
                    {liveState.striker.strikeRate})
                  </span>
                </span>
              </div>
              {/* Non-Striker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted" style={{ fontWeight: 600 }}>
                  {liveState.nonStriker.name}
                </span>
                <span style={{ fontFamily: 'var(--display)', fontSize: '0.95rem' }}>
                  <strong>{liveState.nonStriker.runs}</strong>{' '}
                  <span className="muted tiny">
                    ({liveState.nonStriker.balls}b, {liveState.nonStriker.fours}x4, {liveState.nonStriker.sixes}x6,
                    SR: {liveState.nonStriker.strikeRate})
                  </span>
                </span>
              </div>
            </div>
            <div className="tiny muted" style={{ marginTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.4rem' }}>
              Partnership: <strong>{liveState.partnership.runs} runs</strong> off {liveState.partnership.balls} balls
            </div>
          </div>

          {/* Active Bowler */}
          <div
            style={{
              padding: '0.9rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Current Bowler &bull; {bowlingTeam && <TeamBadge team={bowlingTeam} size="sm" />}{bowlingTeam?.name}
            </span>
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{liveState.bowler.name}</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: '0.95rem' }}>
                <strong>
                  {liveState.bowler.wickets} / {liveState.bowler.runs}
                </strong>{' '}
                <span className="muted tiny">
                  ({liveState.bowler.overs} ov, Econ: {liveState.bowler.economy})
                </span>
              </span>
            </div>
            <div className="tiny muted" style={{ marginTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.4rem' }}>
              Speed: <strong>88.4 km/h</strong> &bull; Length: Good &bull; Turn: 3.2&deg;
            </div>
          </div>
        </div>

        {/* Live Ball-by-Ball Commentary Feed */}
        <div style={{ marginTop: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} color="#f5c542" />
              Live Ball-by-Ball Commentary
            </h3>
            <span className="tiny muted">Auto-updating live</span>
          </div>

          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              paddingRight: '4px',
            }}
          >
            {liveState.commentary.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background:
                    c.type === 'wicket'
                      ? 'rgba(230, 57, 70, 0.12)'
                      : c.type === 'six'
                        ? 'rgba(114, 9, 183, 0.14)'
                        : c.type === 'four'
                          ? 'rgba(42, 157, 143, 0.12)'
                          : 'rgba(255, 255, 255, 0.02)',
                  borderLeft: `3px solid ${
                    c.type === 'wicket'
                      ? '#e63946'
                      : c.type === 'six'
                        ? '#7209b7'
                        : c.type === 'four'
                          ? '#2a9d8f'
                          : 'rgba(255, 255, 255, 0.2)'
                  }`,
                  display: 'flex',
                  gap: '0.8rem',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: '#f5c542',
                    minWidth: '38px',
                  }}
                >
                  {c.ball}
                </span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
