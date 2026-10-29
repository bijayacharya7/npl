import { classifyMatchStatus, mapResult, matchLocalFixture, normalizeName, resolveTeamId } from './mapper.js'

const KHELNOW_LIVE_INDEX = 'https://khelnow.com/cricket/live-score'
const KHELNOW_NPL_RESULTS = 'https://khelnow.com/cricket/competition/nepal-premier-league-1547/fixtures-and-results?competition=1547'
const KHELNOW_MATCH_PAGE = 'https://khelnow.com/live-cricket-score/match-'
const REQUEST_TIMEOUT_MS = 12_000

function extractPageProps(html) {
  const scripts = String(html).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)
  for (const [, script] of scripts) {
    if (!script.includes('"pageProps"')) continue
    try {
      const payload = JSON.parse(script)
      if (payload?.props?.pageProps) return payload.props.pageProps
    } catch {
      // Ignore Next.js runtime scripts and continue to the embedded data script.
    }
  }
  throw new Error('KhelNow did not include its live match data.')
}

async function fetchText(url, fetchImpl) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; NPLScoreboard/1.0)',
      },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`KhelNow returned HTTP ${response.status}.`)
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function dateInNepal(value) {
  const timestamp = typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  return `${values.year}-${values.month}-${values.day}`
}

function playerIdFor(name, providerId, teamId, players) {
  const normalized = normalizeName(name)
  const candidates = players.filter((player) => !teamId || player.teamId === teamId)
  const found = candidates.find((player) => normalizeName(player.name) === normalized) ??
    candidates.find((player) => normalizeName(player.name).includes(normalized) || normalized.includes(normalizeName(player.name)))
  return found?.id ?? `khelnow-${providerId ?? normalized.replace(/\s+/g, '-')}`
}

function scoreParts(innings) {
  const score = String(innings?.scores ?? innings?.scores_full ?? '')
  const [, runs = '', wickets = ''] = score.match(/(\d+)\s*\/\s*(\d+)/) ?? []
  const full = String(innings?.scores_full ?? '')
  const overs = full.match(/\(([\d.]+)\s*ov\)/i)?.[1] ?? innings?.overs ?? 0
  return { runs: Number(runs) || 0, wickets: Number(wickets) || 0, overs: Number(overs) || 0 }
}

function rowsForMatchInsight(insight, innings, local, providerTeamIds, players) {
  if (!innings) return null
  const battingProviderTeamId = String(innings.batting_team_id ?? '')
  const battingTeamId = providerTeamIds[battingProviderTeamId]
  if (!battingTeamId) return null

  const batting = (innings.batsmen ?? []).map((row) => ({
    matchId: local.id,
    playerId: playerIdFor(row.name, row.batsman_id, battingTeamId, players),
    playerName: row.name,
    teamId: battingTeamId,
    runs: Number(row.runs) || 0,
    balls: Number(row.balls_faced) || 0,
    fours: Number(row.fours) || 0,
    sixes: Number(row.sixes) || 0,
    out: Boolean(row.dismissal && !/not out|retired hurt/i.test(row.how_out ?? row.dismissal)),
    active: String(row.batting).toLowerCase() === 'true',
    dismissal: row.how_out || row.dismissal || null,
    strikeRate: Number(row.strike_rate) || 0,
    source: 'khelnow',
  }))

  const bowlingTeamId = battingTeamId === local.homeTeamId ? local.awayTeamId : local.homeTeamId
  const bowling = (innings.bowlers ?? []).map((row) => ({
    matchId: local.id,
    playerId: playerIdFor(row.name, row.bowler_id, bowlingTeamId, players),
    playerName: row.name,
    teamId: bowlingTeamId,
    overs: String(row.overs ?? '0'),
    maidens: Number(row.maidens) || 0,
    runsConceded: Number(row.runs_conceded) || 0,
    wickets: Number(row.wickets) || 0,
    economy: Number(row.econ) || 0,
    active: String(row.bowling).toLowerCase() === 'true',
    source: 'khelnow',
  }))

  const score = scoreParts(innings)
  const currentPartnership = innings.current_partnership
  return {
    batting,
    bowling,
    innings: {
      id: `khelnow-${local.id}-${innings.number ?? insight.innings_id}`,
      number: Number(innings.number ?? insight.innings_id) || null,
      teamId: battingTeamId,
      ...score,
      target: Number(innings.target) || null,
      extras: innings.extra_runs ?? null,
      lastWicket: innings.last_wicket ?? null,
      currentPartnership: currentPartnership ?? null,
    },
    commentary: (insight.commentary ?? []).slice(0, 24).map((item) => ({
      id: item.event_id,
      over: item.over,
      ball: item.ball,
      text: item.commentary || item.text || '',
      runs: Number(item.run) || 0,
      wicket: /\bwicket\b|\bout\b/i.test(`${item.event ?? ''} ${item.commentary ?? ''}`),
      timestamp: item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : null,
    })),
  }
}

function matchDataFromPage(pageProps) {
  return pageProps?.data ?? pageProps?.matchData ?? null
}

function mapKhelNowMatch(data, local, teams, players) {
  const info = data?.match_info
  if (!info || !local) return null

  const teamIds = [local.homeTeamId, local.awayTeamId].filter(Boolean)
  const teamMap = {}
  // The two team records are guaranteed to correspond to the fixture pair;
  // resolve them by normalized name.
  const teamByName = (name) => {
    const needle = normalizeName(name)
    return teamIds.find((id) => {
      const team = teams.find((row) => row.id === id)
      return team && (needle.includes(normalizeName(team.name)) || normalizeName(team.name).includes(needle))
    })
  }
  for (const team of [info.teama, info.teamb]) {
    const id = teamByName(team?.name)
    if (id && team?.team_id) teamMap[String(team.team_id)] = id
  }

  const inningsByNumber = new Map()
  for (const insight of data.matchInsights ?? []) {
    for (const innings of insight.score_card?.innings ?? []) {
      const number = String(innings.number ?? insight.innings_id)
      const previous = inningsByNumber.get(number)
      const details = (innings.batsmen?.length ?? 0) + (innings.bowlers?.length ?? 0)
      const previousDetails = (previous?.innings.batsmen?.length ?? 0) + (previous?.innings.bowlers?.length ?? 0)
      if (!previous || details >= previousDetails) inningsByNumber.set(number, { insight, innings })
    }
  }
  const insightRows = [...inningsByNumber.values()]
    .map(({ insight, innings }) => rowsForMatchInsight(insight, innings, local, teamMap, players))
    .filter(Boolean)
  const innings = insightRows.map((row) => row.innings)
  const statusText = [info.status_str, info.status_note, info.live, info.result].filter(Boolean).join(' ')
  const status = classifyMatchStatus(statusText)
  const tossTeamId = info.toss?.winner ? teamMap[String(info.toss.winner)] : null
  const currentInnings = insightRows.find((row) => Number(row.innings.number) === Number(info.live_inning_number)) ?? insightRows.at(-1)
  const result = status === 'completed'
    ? mapResult(info.result || info.status_note || info.live || '', teamIds, Object.fromEntries(teams.map((team) => [team.id, team])))
    : null
  const commentaryById = new Map()
  for (const item of insightRows.flatMap((row) => row.commentary)) {
    commentaryById.set(String(item.id ?? `${item.over}.${item.ball}:${item.text}`), item)
  }
  const commentary = [...commentaryById.values()]
    .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
    .slice(0, 24)
  const latestBowlers = currentInnings?.bowling ?? []
  const activeBowlers = latestBowlers.filter((row) => row.active)

  return {
    match: {
      matchId: local.id,
      providerMatchId: String(info.match_id ?? data.en_match_id ?? data.id),
      khelnowMatchPageId: String(data.id ?? data.en_match_id ?? info.match_id),
      apiUpdatedAt: new Date().toISOString(),
      dataSourceLabel: 'KhelNow',
      status,
      statusNote: info.status_note || info.live || info.result || null,
      innings,
      result: status === 'completed' ? {
        ...(result ?? { type: 'win', winnerTeamId: teamMap[String(info.winning_team_id)] ?? null }),
        summary: info.result || info.status_note || info.live || info.win_margin || 'Match completed',
      } : null,
      toss: info.toss?.text ? { winnerTeamId: tossTeamId, decision: null, summary: info.toss.text } : null,
      liveConfirmed: status === 'live',
      liveDetails: {
        source: 'KhelNow',
        updatedAt: new Date().toISOString(),
        format: info.format_str ?? 'T20',
        matchNumber: info.match_number ?? null,
        venue: info.venue?.name ?? null,
        statusNote: info.status_note || info.live || null,
        currentInnings: Number(info.live_inning_number) || null,
        batting: insightRows.flatMap((row) => row.batting),
        bowling: insightRows.flatMap((row) => row.bowling),
        currentBatters: (currentInnings?.batting ?? []).filter((row) => !row.out).slice(-2),
        currentBowlers: activeBowlers.length ? activeBowlers : latestBowlers.slice(-2),
        commentary,
        weather: info.weather ?? null,
        pitch: info.pitch ?? null,
      },
    },
    scorecards: {
      batting: insightRows.flatMap((row) => row.batting),
      bowling: insightRows.flatMap((row) => row.bowling),
      fielding: [],
    },
  }
}

function mapKhelNowScheduleMatch(row, localMatches, teams) {
  if (!/nepal premier league/i.test(row?.competition?.title ?? 'Nepal Premier League')) return null
  const local = matchLocalFixture({
    name: row.title ?? '',
    teams: [row.teama?.name, row.teamb?.name].filter(Boolean),
    date: dateInNepal(row.date_start ?? row.dateStart),
  }, localMatches, teams).local
  if (!local || local.verifiedSchedule === false) return null

  const statusText = [row.status_str, row.status_note, row.result].filter(Boolean).join(' ')
  const status = Number(row.status) === 2 || /\bcompleted\b|\bwon by\b/i.test(statusText)
    ? 'completed'
    : classifyMatchStatus(statusText)
  if (!['upcoming', 'live', 'completed', 'abandoned', 'postponed'].includes(status)) return null

  const homeTeamId = resolveTeamId(row.teama?.name, teams)
  const awayTeamId = resolveTeamId(row.teamb?.name, teams)
  const innings = [
    { teamId: homeTeamId, ...scoreParts({ scores_full: row.teama?.scores_full }) },
    { teamId: awayTeamId, ...scoreParts({ scores_full: row.teamb?.scores_full }) },
  ].filter((inning) => inning.teamId && (inning.runs || inning.wickets || inning.overs))
  const teamsById = Object.fromEntries(teams.map((team) => [team.id, team]))
  const mappedResult = status === 'completed'
    ? mapResult(statusText, [local.homeTeamId, local.awayTeamId], teamsById)
    : null
  const winningTeamId = String(row.winning_team_id ?? '') === String(row.teama?.team_id ?? '')
    ? homeTeamId
    : String(row.winning_team_id ?? '') === String(row.teamb?.team_id ?? '')
      ? awayTeamId
      : null
  const result = status === 'completed'
    ? {
        ...(mappedResult
          ? { ...mappedResult, winnerTeamId: mappedResult.winnerTeamId ?? winningTeamId }
          : { type: 'win', winnerTeamId: winningTeamId, margin: null }),
        summary: row.status_note || row.result || statusText,
      }
    : null

  return {
    matchId: local.id,
    providerMatchId: String(row.match_id ?? row.id),
    khelnowMatchPageId: String(row.id),
    apiUpdatedAt: new Date().toISOString(),
    dataSourceLabel: 'KhelNow',
    status,
    statusNote: row.status_note || row.result || null,
    innings,
    result,
    toss: null,
    liveConfirmed: false,
    liveDetails: null,
  }
}

function isInLiveWindow(match, now) {
  const start = new Date(match?.startTime).getTime()
  return Number.isFinite(start) && now >= start - 30 * 60 * 1000 && now <= start + 4 * 60 * 60 * 1000
}

function mergeScorecards(...scorecards) {
  const merged = { batting: [], bowling: [], fielding: [] }
  for (const kind of Object.keys(merged)) {
    const rows = scorecards.flatMap((scorecard) => scorecard?.[kind] ?? [])
    const unique = new Map()
    for (const row of rows) unique.set(`${row.matchId}:${row.playerId}`, row)
    merged[kind] = [...unique.values()]
  }
  return merged
}

export async function fetchKhelNowNplLive({
  localMatches,
  teams,
  players,
  previousPayload = null,
  now = Date.now(),
  fetchImpl = globalThis.fetch,
  fetchAll = false,
}) {
  let liveCandidates = []
  try {
    const pageProps = extractPageProps(await fetchText(KHELNOW_LIVE_INDEX, fetchImpl))
    liveCandidates = (pageProps.initialMatches ?? []).flatMap((row) => {
      if (!/nepal premier league/i.test(row.competition?.name ?? '')) return []
      if (String(row.competition?.season ?? '') !== '2026') return []
      const localDate = dateInNepal(row.dateStart)
      const fixture = matchLocalFixture({
        name: `${row.teamA?.teamName ?? ''} vs ${row.teamB?.teamName ?? ''}`,
        teams: [row.teamA?.teamName, row.teamB?.teamName].filter(Boolean),
        date: localDate,
      }, localMatches, teams).local
      return fixture && fixture.verifiedSchedule !== false && row.matchId
        ? [{ pageId: String(row.matchId), local: fixture }]
        : []
    })
  } catch {
    // The results page below can still provide completed NPL scores if the live index is unavailable.
  }

  const liveIds = new Set(liveCandidates.map((candidate) => candidate.local.id))
  const knownMatches = (previousPayload?.matches ?? [])
    .filter((match) =>
      !['completed', 'abandoned', 'postponed'].includes(match.status) &&
      (match.status === 'live' || match.innings?.length) &&
      match.khelnowMatchPageId &&
      !liveIds.has(match.matchId),
    )
    .flatMap((match) => {
      const local = localMatches.find((row) => row.id === match.matchId)
      return local ? [{ pageId: match.khelnowMatchPageId, local }] : []
    })

  const liveMatches = []
  const liveScorecards = []
  for (const { pageId, local } of [...liveCandidates, ...knownMatches]) {
    try {
      const detailHtml = await fetchText(`${KHELNOW_MATCH_PAGE}${encodeURIComponent(pageId)}`, fetchImpl)
      const data = matchDataFromPage(extractPageProps(detailHtml))
      const mapped = mapKhelNowMatch(data, local, teams, players)
      if (!mapped) continue
      mapped.match.khelnowMatchPageId = pageId
      liveMatches.push(mapped.match)
      if (mapped.scorecards) liveScorecards.push(mapped.scorecards)
    } catch {
      // Keep the prior score and continue to the competition results page.
    }
  }

  const previousMatches = previousPayload?.matches ?? []
  const previousScorecards = previousPayload?.scorecards

  if (liveMatches.length && !fetchAll) {
    const currentIds = new Set(liveMatches.map((match) => match.matchId))
    return {
      matches: [...previousMatches.filter((match) => !currentIds.has(match.matchId)), ...liveMatches],
      scorecards: mergeScorecards(previousScorecards, ...liveScorecards),
      fetchedAt: new Date(now).toISOString(),
    }
  }

  let scheduleMatches = []
  try {
    const resultsHtml = await fetchText(KHELNOW_NPL_RESULTS, fetchImpl)
    const resultsProps = extractPageProps(resultsHtml)
    scheduleMatches = resultsProps.scheduleData?.data?.matches ?? []
  } catch {
    if (liveMatches.length) {
      const currentIds = new Set(liveMatches.map((match) => match.matchId))
      return {
        matches: [...previousMatches.filter((match) => !currentIds.has(match.matchId)), ...liveMatches],
        scorecards: mergeScorecards(previousScorecards, ...liveScorecards),
        fetchedAt: new Date(now).toISOString(),
      }
    }
    throw new Error('KhelNow competition results are unavailable.')
  }
  const scheduledMatches = scheduleMatches
    .map((row) => mapKhelNowScheduleMatch(row, localMatches, teams))
    .filter(Boolean)
  const scheduledIds = new Set(scheduledMatches.map((match) => match.matchId))
  const retainedMatches = previousMatches.filter((match) => !scheduledIds.has(match.matchId))
  const matches = [...retainedMatches, ...scheduledMatches, ...liveMatches]

  const detailCandidates = [...scheduledMatches, ...liveMatches]
    .filter((match) =>
      (['completed', 'live'].includes(match.status) || isInLiveWindow(localMatches.find((local) => local.id === match.matchId), now)) &&
      match.khelnowMatchPageId,
    )
  const detailedScorecards = liveScorecards
  const detailedMatches = []
  for (const scheduled of detailCandidates) {
    if (liveMatches.some((match) => match.matchId === scheduled.matchId)) continue
    try {
      const detailHtml = await fetchText(`${KHELNOW_MATCH_PAGE}${encodeURIComponent(scheduled.khelnowMatchPageId)}`, fetchImpl)
      const detailed = mapKhelNowMatch(
        matchDataFromPage(extractPageProps(detailHtml)),
        localMatches.find((match) => match.id === scheduled.matchId),
        teams,
        players,
      )
      if (detailed?.match) detailedMatches.push(detailed.match)
      if (detailed?.scorecards) detailedScorecards.push(detailed.scorecards)
    } catch {
      // Keep the schedule result and continue fetching the remaining match pages.
    }
  }

  return {
    matches: [
      ...matches.filter((match) => !detailedMatches.some((detailed) => detailed.matchId === match.matchId)),
      ...detailedMatches,
    ],
    scorecards: mergeScorecards(previousScorecards, ...detailedScorecards),
    fetchedAt: new Date(now).toISOString(),
  }
}

export const khelnowInternals = { extractPageProps, mapKhelNowMatch, scoreParts, rowsForMatchInsight }
