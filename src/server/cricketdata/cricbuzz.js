import { matchLocalFixture, normalizeName, resolveTeamId } from './mapper.js'

const RAPIDAPI_HOST = 'cricbuzz-cricket.p.rapidapi.com'

function nplDate(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function normalizeTeamName(name = '') {
  return normalizeName(name).replace(/\broyals?\b/gi, 'royals').replace(/\blions?\b/gi, 'lions').replace(/\bkings?\b/gi, 'kings').replace(/\brhinos?\b/gi, 'rhinos').replace(/\byaks?\b/gi, 'yaks').replace(/\bbolts?\b/gi, 'bolts').replace(/\bavengers?\b/gi, 'avengers').replace(/\bgurkhas?\b/gi, 'gurkhas')
}

function playerLookup(players, name, teamId) {
  const normalized = normalizeName(name)
  const sameTeam = players.filter((player) => !teamId || player.teamId === teamId)
  const player = sameTeam.find((row) => normalizeName(row.name) === normalized) ??
    sameTeam.find((row) => normalized && (normalizeName(row.name).includes(normalized) || normalized.includes(normalizeName(row.name))))
  return player?.id ?? `cricbuzz-${normalized.replace(/\s+/g, '-')}`
}

export async function fetchCricbuzzNplLive({ apiKey, localMatches, teams, players = [], fetchImpl = globalThis.fetch, now = Date.now() }) {
  if (!apiKey) return { matches: [], scorecards: { batting: [], bowling: [], fielding: [] }, fetchedAt: null }
  
  const headers = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': RAPIDAPI_HOST,
    Accept: 'application/json',
  }
  
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  
  try {
    // Try to get live matches
    const liveUrl = `https://${RAPIDAPI_HOST}/matches/v1/live`
    const liveRes = await fetchImpl(liveUrl, { headers, signal: controller.signal })
    if (!liveRes.ok) {
      throw new Error(`Cricbuzz returned HTTP ${liveRes.status}`)
    }
    const liveData = await liveRes.json()
    
    const matches = []
    const batting = []
    const bowling = []
    const fielding = []
    
    // Parse live matches
    const typeMatches = liveData?.typeMatches || []
    for (const typeMatch of typeMatches) {
      const seriesMatches = typeMatch?.seriesMatches || []
      for (const seriesMatch of seriesMatches) {
        const seriesAdWrapper = seriesMatch?.seriesAdWrapper
        const matchDetails = seriesAdWrapper?.matches || []
        for (const matchDetail of matchDetails) {
          const matchInfo = matchDetail?.matchInfo
          if (!matchInfo) continue
          
          const team1 = matchInfo?.team1?.teamName || ''
          const team2 = matchInfo?.team2?.teamName || ''
          const seriesName = matchInfo?.seriesName || ''
          
          // Check if it's NPL
          if (!/nepal premier league|npl/i.test(seriesName)) continue
          
          const match = matchLocalFixture({ name: `${team1} vs ${team2}`, teams: [team1, team2] }, localMatches, teams).local
          if (!match) continue
          
          const status = matchInfo?.status || ''
          const isCompleted = /won by|complete|result/i.test(status)
          const isLive = !isCompleted && (/live|innings|progress/i.test(status) || matchInfo?.state === 'In Progress')
          
          let result = null
          if (isCompleted && status) {
            if (/abandon|no result/i.test(status)) {
              result = { type: 'no-result', winnerTeamId: null, margin: null, summary: status }
            } else {
              let winnerTeamId = null
              if (/won by/i.test(status)) {
                if (new RegExp(team1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(status)) {
                  winnerTeamId = resolveTeamId(team1, teams)
                } else if (new RegExp(team2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(status)) {
                  winnerTeamId = resolveTeamId(team2, teams)
                }
              }
              result = { type: 'win', winnerTeamId, margin: null, summary: status }
            }
          }
          
          const team1Id = resolveTeamId(team1, teams)
          const team2Id = resolveTeamId(team2, teams)
          const innings = []
          
          if (matchDetail?.matchScore) {
            const score1 = matchDetail.matchScore?.team1Score
            const score2 = matchDetail.matchScore?.team2Score
            if (score1) {
              const inng1 = score1.inngs1 || score1
              innings.push({
                teamId: team1Id,
                runs: Number(inng1.runs) || 0,
                wickets: Number(inng1.wickets) || 0,
                overs: Number(inng1.overs) || 0,
              })
            }
            if (score2) {
              const inng2 = score2.inngs1 || score2
              innings.push({
                teamId: team2Id,
                runs: Number(inng2.runs) || 0,
                wickets: Number(inng2.wickets) || 0,
                overs: Number(inng2.overs) || 0,
              })
            }
          }
          
          matches.push({
            matchId: match.id,
            providerMatchId: String(matchInfo?.matchId || ''),
            status: isCompleted ? 'completed' : isLive ? 'live' : 'upcoming',
            statusNote: status,
            innings,
            result,
            toss: matchInfo?.tossResults ? {
              winnerTeamId: matchInfo.tossResults.tossWinnerId === matchInfo.team1?.teamId ? team1Id : matchInfo.tossResults.tossWinnerId === matchInfo.team2?.teamId ? team2Id : null,
              decision: matchInfo.tossResults.decision || null,
              summary: matchInfo.tossResults.tossWinnerName ? `${matchInfo.tossResults.tossWinnerName} won the toss and elected to ${matchInfo.tossResults.decision}` : null,
            } : null,
            dataSourceLabel: 'Cricbuzz',
            statusSource: 'api',
            liveConfirmed: isLive,
            apiUpdatedAt: new Date(now).toISOString(),
          })
        }
      }
    }
    
    return {
      matches,
      scorecards: { batting, bowling, fielding },
      fetchedAt: new Date(now).toISOString(),
      liveMatches: matches.filter(m => m.status === 'live').length,
    }
  } catch (error) {
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
