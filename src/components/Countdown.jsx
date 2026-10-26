import { useEffect, useState } from 'react'
import { timeUntil } from '../lib/format.js'

function units(target) {
  return timeUntil(target)
}

export function Countdown({ target, label = 'Countdown to first ball' }) {
  const [remaining, setRemaining] = useState(() => units(target))

  useEffect(() => {
    setRemaining(units(target))
    const timer = setInterval(() => setRemaining(units(target)), 1000)
    return () => clearInterval(timer)
  }, [target])

  const items = [
    { value: remaining.days, label: 'Days' },
    { value: remaining.hours, label: 'Hours' },
    { value: remaining.minutes, label: 'Mins' },
    { value: remaining.seconds, label: 'Secs' },
  ]

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {remaining.expired
          ? 'This match has started or is about to start.'
          : `${label}: ${remaining.days} days, ${remaining.hours} hours and ${remaining.minutes} minutes.`}
      </p>
      <div className="countdown" aria-hidden="true">
        {items.map((item) => (
          <div className="countdown-unit" key={item.label}>
            <strong>{String(item.value).padStart(2, '0')}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {remaining.expired && <p className="tiny muted" style={{ marginTop: '0.4rem' }}>Scheduled start time has passed.</p>}
    </div>
  )
}
