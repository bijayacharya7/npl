// Cricket providers update live scoreboards frequently; poll the server-side
// provider aggregator at a modest cadence to keep UI and API usage controlled.
const LIVE_POLL_MS = 30_000
const IDLE_POLL_MS = 10 * 60_000
const LIVE_WINDOW_BEFORE_MS = 30 * 60_000
const LIVE_WINDOW_AFTER_MS = 4 * 60 * 60_000

export function feedPollingInterval(feed, matches = [], now = Date.now()) {
  if (feed?.meta?.liveFresh) return LIVE_POLL_MS

  const hasScheduledLiveWindow = matches.some((match) => {
    if (!['upcoming', 'live'].includes(match.status)) return false
    const start = new Date(match.startTime).getTime()
    return Number.isFinite(start) && now >= start - LIVE_WINDOW_BEFORE_MS && now <= start + LIVE_WINDOW_AFTER_MS
  })

  return hasScheduledLiveWindow ? LIVE_POLL_MS : IDLE_POLL_MS
}
