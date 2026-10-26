/**
 * LOCAL DEMO STORE.
 *
 * Uses localStorage for the single-admin prototype and implements the store
 * methods used by the public site and admin dashboard.
 *
 * Limitations, shown in the UI: data lives in one browser, images are stored as
 * data URLs, and access control is not a real security boundary.
 */

import { TEAMS } from '../../data/teams.js'
import { PLAYERS, slugify } from '../../data/players.js'
import { MATCHES } from '../../data/matches.js'
import { ARTICLES } from '../../data/articles.js'
import { DEFAULT_POINTS_RULES } from '../../data/tournament.js'
import { getSession } from './localAuth.js'
import { ALLOWED_IMAGE_TYPES } from '../supabase.js'

const DB_KEY = 'nplfz.local.db.v1'
const LOCAL_IMAGE_LIMIT = 400 * 1024

const clone = (value) => JSON.parse(JSON.stringify(value))

function seedDatabase() {
  return {
    schemaVersion: 2,
    teams: clone(TEAMS),
    players: clone(PLAYERS),
    matches: clone(MATCHES),
    articles: clone(ARTICLES),
    activity: [],
    rules: clone(DEFAULT_POINTS_RULES),
    scorecards: { batting: [], bowling: [], fielding: [] },
  }
}

function read() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      const fresh = seedDatabase()
      localStorage.setItem(DB_KEY, JSON.stringify(fresh))
      return fresh
    }
    const parsed = JSON.parse(raw)
    // Merge any data collections added in a later app version without wiping
    // the user's local edits.
    for (const [key, value] of Object.entries(seedDatabase())) {
      if (!(key in parsed)) parsed[key] = value
    }
    // Fan accounts, profiles, favorites, votes, and predictions were removed.
    for (const key of ['polls', 'pollVotes', 'predictions', 'profiles']) delete parsed[key]
    parsed.schemaVersion = 2
    return parsed
  } catch (error) {
    console.error('[NPL Fan Zone] Could not read local data, reseeding.', error)
    const fresh = seedDatabase()
    localStorage.setItem(DB_KEY, JSON.stringify(fresh))
    return fresh
  }
}

function write(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch (error) {
    console.error('[NPL Fan Zone] Could not save local data.', error)
    throw new Error(
      'Your browser storage is full. Remove some uploaded images or use Supabase for unlimited storage.',
    )
  }
}

function requireAdmin() {
  if (!import.meta.env.DEV) {
    throw new Error('Local demo storage is read-only outside development. Configure Supabase to make changes.')
  }
  const session = getSession()
  if (session?.role !== 'admin') {
    throw new Error('Admin access required. Sign in with an administrator account.')
  }
  return session
}

const now = () => new Date().toISOString()

function uniqueId(base, existingIds) {
  const clean = slugify(base) || 'item'
  let candidate = clean
  let counter = 2
  while (existingIds.has(candidate)) {
    candidate = `${clean}-${counter}`
    counter += 1
  }
  return candidate
}

function upsert(list, item) {
  const index = list.findIndex((row) => row.id === item.id)
  if (index >= 0) list[index] = item
  else list.push(item)
  return item
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function requireText(value, label, min = 1) {
  const clean = String(value ?? '').trim()
  if (clean.length < min) throw new Error(`${label} is required.`)
  return clean
}

function validateTeam(team, db) {
  const name = requireText(team.name, 'Team name', 2)
  const id = team.id || uniqueId(name, new Set(db.teams.map((t) => t.id)))
  if (db.teams.some((t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('A team with that name already exists.')
  }
  return {
    ...team,
    id,
    name,
    shortName: String(team.shortName ?? name).trim(),
    abbreviation: requireText(team.abbreviation, 'Abbreviation', 2).toUpperCase().slice(0, 4),
    primaryColor: team.primaryColor || '#1b2a6b',
    accentColor: team.accentColor || '#f5c542',
    description: String(team.description ?? '').trim(),
    lastVerified: team.lastVerified ?? now().slice(0, 10),
    updatedAt: now(),
  }
}

function validatePlayer(player, db) {
  const name = requireText(player.name, 'Player name', 2)
  if (!player.teamId || !db.teams.some((t) => t.id === player.teamId)) {
    throw new Error('Choose a team for this player.')
  }
  const id = player.id || uniqueId(name, new Set(db.players.map((p) => p.id)))
  return {
    ...player,
    id,
    name,
    role: player.role || null,
    nationality: player.nationality ? String(player.nationality).trim() : null,
    isCaptain: Boolean(player.isCaptain),
    jerseyNumber: player.jerseyNumber === '' || player.jerseyNumber == null ? null : Number(player.jerseyNumber),
    imageUrl: player.imageUrl || null,
    bio: player.bio || null,
    verified: Boolean(player.verified),
    lastVerified: player.lastVerified ?? now().slice(0, 10),
    updatedAt: now(),
  }
}

function validateMatch(match, db) {
  if (!match.startTime) throw new Error('Match date and time is required.')
  if (!match.stage) throw new Error('Match stage is required.')
  if (match.stage === 'league') {
    if (!match.homeTeamId || !match.awayTeamId) throw new Error('Choose both teams.')
    if (match.homeTeamId === match.awayTeamId) throw new Error('A team cannot play itself.')
  }
  if (Number.isNaN(new Date(match.startTime).getTime())) {
    throw new Error('Match start time is not a valid date.')
  }
  const innings = (match.innings ?? []).map((row) => ({
    teamId: row.teamId,
    runs: Number(row.runs) || 0,
    wickets: Math.min(10, Math.max(0, Number(row.wickets) || 0)),
    overs: String(row.overs ?? '0'),
    createdAt: row.createdAt ?? now(),
  }))
  if (match.homeTeamId && match.awayTeamId) {
    const ids = innings.map((i) => i.teamId)
    if (new Set(ids).size !== ids.length) throw new Error('There is more than one innings for the same team.')
  }
  const id = match.id || `npl-custom-${Date.now()}`
  return {
    ...match,
    id,
    matchNo: Number(match.matchNo) || db.matches.length + 1,
    homeTeamId: match.homeTeamId || null,
    awayTeamId: match.awayTeamId || null,
    venue: match.venue || 'Tribhuvan University International Cricket Ground, Kirtipur, Nepal',
    status: match.status || 'upcoming',
    innings,
    result: match.result?.type ? match.result : null,
    playerOfMatchId: match.playerOfMatchId || null,
    updatedAt: now(),
  }
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

export const localStore = {
  mode: 'local',

  async loadSnapshot() {
    const db = read()
    return {
      teams: clone(db.teams),
      players: clone(db.players),
      matches: clone(db.matches),
      articles: clone(db.articles),
      rules: clone(db.rules),
      scorecards: clone(db.scorecards),
      mode: 'local',
    }
  },

  /* ------------------------------- teams -------------------------------- */
  async saveTeam(team) {
    requireAdmin()
    const db = read()
    const record = validateTeam(team, db)
    upsert(db.teams, record)
    write(db)
    return clone(record)
  },
  async deleteTeam(teamId) {
    requireAdmin()
    const db = read()
    if (db.matches.some((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)) {
      throw new Error('This team has fixtures. Delete or reassign those matches first.')
    }
    db.teams = db.teams.filter((t) => t.id !== teamId)
    db.players = db.players.filter((p) => p.teamId !== teamId)
    write(db)
  },

  /* ------------------------------- players ------------------------------ */
  async savePlayer(player) {
    requireAdmin()
    const db = read()
    const record = validatePlayer(player, db)
    upsert(db.players, record)
    if (record.isCaptain) {
      for (const other of db.players) {
        if (other.teamId === record.teamId && other.id !== record.id) other.isCaptain = false
      }
    }
    write(db)
    return clone(record)
  },
  async deletePlayer(playerId) {
    requireAdmin()
    const db = read()
    db.players = db.players.filter((p) => p.id !== playerId)
    write(db)
  },

  /* ------------------------------- matches ------------------------------ */
  async saveMatch(match) {
    requireAdmin()
    const db = read()
    const record = validateMatch(match, db)
    upsert(db.matches, record)
    write(db)
    return clone(record)
  },
  async deleteMatch(matchId) {
    requireAdmin()
    const db = read()
    db.matches = db.matches.filter((m) => m.id !== matchId)
    write(db)
  },

  /* ------------------------------ articles ------------------------------ */
  async saveArticle(article) {
    requireAdmin()
    const db = read()
    const title = requireText(article.title, 'Title', 4)
    const baseSlug = slugify(article.slug || title)
    const id = article.id || uniqueId(baseSlug, new Set(db.articles.map((a) => a.id)))
    if (db.articles.some((a) => a.id !== id && a.slug === baseSlug)) {
      throw new Error('Another article already uses that slug.')
    }
    const record = {
      ...article,
      id,
      slug: baseSlug,
      title,
      excerpt: requireText(article.excerpt, 'Excerpt', 10),
      category: article.category || 'Explainer',
      author: requireText(article.author, 'Author', 2),
      status: article.status === 'draft' ? 'draft' : 'published',
      publishedAt: article.publishedAt || now(),
      isSample: Boolean(article.isSample),
      updatedAt: now(),
    }
    upsert(db.articles, record)
    write(db)
    return clone(record)
  },
  async deleteArticle(articleId) {
    requireAdmin()
    const db = read()
    db.articles = db.articles.filter((a) => a.id !== articleId)
    write(db)
  },

  /* -------------------------------- rules ------------------------------- */
  async saveRules(rules) {
    requireAdmin()
    const db = read()
    db.rules = {
      ...db.rules,
      ...rules,
      win: Number(rules.win),
      tie: Number(rules.tie),
      noResult: Number(rules.noResult),
      loss: Number(rules.loss),
      oversPerInnings: Number(rules.oversPerInnings) || 20,
    }
    write(db)
    return clone(db.rules)
  },

  /* ------------------------------ scorecards ---------------------------- */
  async saveScorecard(kind, row) {
    requireAdmin()
    if (!['batting', 'bowling', 'fielding'].includes(kind)) throw new Error('Unknown scorecard type.')
    const db = read()
    if (!db.matches.some((m) => m.id === row.matchId)) throw new Error('Choose a valid match.')
    if (!db.players.some((p) => p.id === row.playerId)) throw new Error('Choose a valid player.')
    const record = { ...row, id: row.id ?? crypto.randomUUID() }
    if (kind === 'batting') {
      record.runs = Number(row.runs) || 0
      record.balls = Number(row.balls) || 0
      record.fours = Number(row.fours) || 0
      record.sixes = Number(row.sixes) || 0
      record.out = Boolean(row.out)
    }
    if (kind === 'bowling') {
      record.overs = String(row.overs ?? '0')
      record.runsConceded = Number(row.runsConceded) || 0
      record.wickets = Number(row.wickets) || 0
      record.maidens = Number(row.maidens) || 0
    }
    if (kind === 'fielding') {
      record.catches = Number(row.catches) || 0
      record.stumpings = Number(row.stumpings) || 0
    }
    db.scorecards[kind] = db.scorecards[kind].filter((item) => item.id !== record.id)
    db.scorecards[kind].push(record)
    write(db)
    return clone(record)
  },
  async deleteScorecard(kind, id) {
    requireAdmin()
    const db = read()
    if (!db.scorecards[kind]) throw new Error('Unknown scorecard type.')
    db.scorecards[kind] = db.scorecards[kind].filter((item) => item.id !== id)
    write(db)
  },

  /* ------------------------------- activity ----------------------------- */
  async listActivity(limit = 20) {
    const db = read()
    return clone(db.activity.slice(0, limit))
  },
  async logActivity(action, entity, detail) {
    const session = getSession()
    const db = read()
    db.activity.unshift({
      id: crypto.randomUUID(),
      userId: session?.userId ?? null,
      userName: session?.displayName ?? 'System',
      action,
      entity,
      detail,
      createdAt: now(),
    })
    db.activity = db.activity.slice(0, 100)
    write(db)
  },

  /* -------------------------------- media ------------------------------- */
  async uploadImage(file, folder) {
    requireAdmin()
    if (!file) throw new Error('Choose an image first.')
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Use a JPEG, PNG, WebP or GIF image.')
    }
    if (file.size > LOCAL_IMAGE_LIMIT) {
      throw new Error(
        'Local demo mode keeps images in browser storage. Please use an image under 400 KB, or connect Supabase Storage for larger files.',
      )
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Could not read that image.'))
      reader.readAsDataURL(file)
    })
  },
  async deleteImage() {
    // Data URLs have no separate storage object to remove.
    return true
  },
}

export function resetLocalData() {
  localStorage.removeItem(DB_KEY)
  return seedDatabase()
}
