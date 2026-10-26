/**
 * Merge a CricketData.org overlay onto local/admin match records.
 * Manual admin corrections win when locked or when they are newer than the API fetch.
 */

export function isLiveFresh(overlayMatch, meta) {
  if (!overlayMatch || overlayMatch.status !== 'live') return false
  return Boolean(meta?.liveFresh && meta.liveMatchIds?.includes(overlayMatch.matchId))
}

export function mergeMatch(localMatch, overlayMatch, meta, now = Date.now()) {
  if (!localMatch) return null
  if (!overlayMatch || localMatch.manualOverride) {
    return {
      ...localMatch,
      scoreSource: localMatch.status === 'live' ? 'admin' : localMatch.innings?.length ? 'admin' : 'none',
      liveConfirmed: false,
    }
  }

  const fetchedAt = meta?.fetchedAt ? new Date(meta.fetchedAt).getTime() : 0
  const localUpdated = localMatch.updatedAt ? new Date(localMatch.updatedAt).getTime() : 0
  const adminHasScore = Boolean(localMatch.result?.type || (localMatch.innings ?? []).length)
  const adminIsNewer = adminHasScore && localUpdated && fetchedAt && localUpdated > fetchedAt

  if (adminIsNewer) {
    return {
      ...localMatch,
      scoreSource: 'admin',
      liveConfirmed: false,
      apiStatusNote: overlayMatch.statusNote ?? null,
    }
  }

  const liveConfirmed = isLiveFresh(overlayMatch, meta)
  let status = localMatch.status
  if (overlayMatch.status === 'completed' || overlayMatch.status === 'abandoned' || overlayMatch.status === 'postponed') {
    status = overlayMatch.status
  } else if (liveConfirmed) {
    status = 'live'
  } else if (overlayMatch.status === 'live') {
    status = localMatch.status === 'completed' ? 'completed' : 'upcoming'
  } else if (overlayMatch.status === 'upcoming') {
    status = localMatch.status === 'live' ? 'upcoming' : localMatch.status
  }

  const innings = overlayMatch.innings?.length ? overlayMatch.innings : localMatch.innings
  const result = overlayMatch.result ?? localMatch.result

  return {
    ...localMatch,
    status,
    statusNote: overlayMatch.statusNote ?? localMatch.statusNote,
    innings,
    result,
    toss: overlayMatch.toss ?? localMatch.toss,
    liveDetails: overlayMatch.liveDetails ?? localMatch.liveDetails ?? null,
    dataSourceLabel: overlayMatch.dataSourceLabel ?? localMatch.dataSourceLabel ?? null,
    statusSource: overlayMatch.statusSource ?? localMatch.statusSource,
    scoreSource: liveConfirmed ? 'api-live' : overlayMatch.innings?.length || overlayMatch.result ? 'api-cached' : localMatch.innings?.length ? 'admin' : 'none',
    liveConfirmed,
    providerMatchId: overlayMatch.providerMatchId,
    apiUpdatedAt: overlayMatch.apiUpdatedAt ?? meta?.fetchedAt ?? null,
    updatedAt: overlayMatch.apiUpdatedAt ?? meta?.fetchedAt ?? localMatch.updatedAt,
  }
}

export function applyScheduledLiveStatus(match, now = Date.now()) {
  if (!match || match.status !== 'upcoming' || match.manualOverride || match.result) return match

  const start = new Date(match.startTime).getTime()
  if (!Number.isFinite(start)) return match

  // Fixture times are the verified local schedule. Use them to avoid leaving
  // a match labelled Upcoming while play is expected, but never invent scores.
  // The published schedule and live score providers can differ by a few
  // minutes. Start the fallback shortly before the listed time so a delayed
  // schedule does not keep an actively played match marked Upcoming.
  const liveWindowOpens = start - 20 * 60_000
  const liveWindowCloses = start + 5 * 60 * 60_000
  if (now < liveWindowOpens || now > liveWindowCloses) return match

  return { ...match, status: 'live', statusSource: 'schedule', liveConfirmed: false }
}

export function mergeScorecards(localCards, overlayCards, mergedMatches) {
  const locked = new Set((mergedMatches ?? []).filter((match) => match.manualOverride || match.scoreSource === 'admin').map((match) => match.id))
  const mergeKind = (kind) => {
    const local = (localCards?.[kind] ?? []).filter((row) => locked.has(row.matchId) || !overlayCards?.[kind]?.length)
    const incoming = (overlayCards?.[kind] ?? []).filter((row) => !locked.has(row.matchId))
    if (!incoming.length) return localCards?.[kind] ?? []
    const keys = new Set(incoming.map((row) => `${row.matchId}:${row.playerId}`))
    const kept = (localCards?.[kind] ?? []).filter((row) => locked.has(row.matchId) || !keys.has(`${row.matchId}:${row.playerId}`))
    return [...kept, ...incoming]
  }
  return {
    batting: mergeKind('batting'),
    bowling: mergeKind('bowling'),
    fielding: mergeKind('fielding'),
  }
}

export function mergeSnapshot(snapshot, feed, now = Date.now()) {
  const overlayById = Object.fromEntries((feed?.overlay?.matches ?? []).map((row) => [row.matchId, row]))
  const matches = (snapshot.matches ?? [])
    .map((match) => mergeMatch(match, overlayById[match.id], feed?.meta, now))
    .map((match) => applyScheduledLiveStatus(match, now))
  const scorecards = mergeScorecards(snapshot.scorecards, feed?.overlay?.scorecards, matches)
  return {
    ...snapshot,
    matches,
    scorecards,
    cricketdata: feed ?? null,
  }
}
