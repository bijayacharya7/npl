const NPT = 'Asia/Kathmandu'

export const NPT_LABEL = 'NPT'

function parts(date, options) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: NPT, ...options }).format(date)
}

export function toDate(value) {
  return value instanceof Date ? value : new Date(value)
}

/** "Mon 26 Oct" */
export function formatMatchDate(value) {
  return parts(toDate(value), { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "5:00 pm" */
export function formatMatchTime(value) {
  return parts(toDate(value), { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** "Monday, 26 October 2026" */
export function formatLongDate(value) {
  return parts(toDate(value), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "26 Oct 2026, 5:00 pm" */
export function formatDateTime(value) {
  if (!value) return '\u2014'
  return `${parts(toDate(value), { day: 'numeric', month: 'short', year: 'numeric' })}, ${formatMatchTime(value)}`
}

/** YYYY-MM-DD in Nepal time, used for date filters. */
export function nptDateKey(value) {
  const d = toDate(value)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NPT,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function formatDateKey(key) {
  if (!key) return ''
  const [year, month, day] = key.split('-').map(Number)
  return parts(new Date(Date.UTC(year, month - 1, day, 12)), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

export function formatScore(innings) {
  if (!innings) return '\u2014'
  const wickets = innings.wickets ?? 0
  const overs = innings.overs ?? '0'
  const allOut = Number(wickets) >= 10
  return `${innings.runs ?? 0}${allOut ? '' : `/${wickets}`} (${overs} ov)`
}

export function timeUntil(value) {
  const target = toDate(value).getTime()
  const diff = target - Date.now()
  const expired = diff <= 0
  const totalSeconds = Math.max(0, Math.floor(diff / 1000))
  return {
    expired,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  }
}

export function countdownLabel(remaining) {
  if (remaining.expired) return 'Starting soon'
  if (remaining.days > 0) return `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m`
  if (remaining.hours > 0) return `${remaining.hours}h ${remaining.minutes}m ${remaining.seconds}s`
  return `${remaining.minutes}m ${remaining.seconds}s`
}

export function matchTitle(match, teamsById) {
  const home = match.homeTeamId ? teamsById?.[match.homeTeamId]?.name : match.homeLabel
  const away = match.awayTeamId ? teamsById?.[match.awayTeamId]?.name : match.awayLabel
  return `${home ?? 'TBC'} vs ${away ?? 'TBC'}`
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function truncate(text, max = 140) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trimEnd()}\u2026` : text
}
