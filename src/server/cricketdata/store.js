import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { DATASETS, utcDay } from './config.js'

const memoryLocks = new Map()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createMemoryStore() {
  const cache = new Map()
  const events = []
  let quota = { day: utcDay(), requestCount: 0, providerHitsToday: null, providerHitsLimit: 100, lastError: null, rateLimitedAt: null }

  function ensureDay(now) {
    const day = utcDay(now)
    if (quota.day !== day) {
      quota = { ...quota, day, requestCount: 0, lastError: null, rateLimitedAt: null }
    }
  }

  return {
    kind: 'memory',
    async getCache(key) {
      return cache.get(key) ?? null
    },
    async setCache(key, row) {
      cache.set(key, { ...row, key })
      return cache.get(key)
    },
    async listCache() {
      return [...cache.values()]
    },
    async tryLock(key, ttlMs, now = new Date()) {
      const row = cache.get(key)
      const until = row?.lockUntil ? new Date(row.lockUntil).getTime() : 0
      if (until > now.getTime()) return false
      cache.set(key, {
        ...(row ?? { key, payload: null, fetchedAt: null, expiresAt: null, status: 'empty' }),
        lockUntil: new Date(now.getTime() + ttlMs).toISOString(),
      })
      return true
    },
    async unlock(key) {
      const row = cache.get(key)
      if (!row) return
      cache.set(key, { ...row, lockUntil: null })
    },
    async consumeQuota(limit, now = new Date()) {
      ensureDay(now)
      if (quota.requestCount >= limit) {
        return { allowed: false, requestCount: quota.requestCount, day: quota.day }
      }
      quota.requestCount += 1
      quota.lastRequestAt = now.toISOString()
      return { allowed: true, requestCount: quota.requestCount, day: quota.day }
    },
    async getQuota(now = new Date()) {
      ensureDay(now)
      return { ...quota }
    },
    async updateQuota(patch, now = new Date()) {
      ensureDay(now)
      quota = { ...quota, ...patch }
      return { ...quota }
    },
    async addEvent(event) {
      events.unshift({ id: `${Date.now()}-${events.length}`, createdAt: new Date().toISOString(), ...event })
      if (events.length > 50) events.length = 50
    },
    async listEvents() {
      return events
    },
  }
}

async function withProcessLock(key, fn) {
  const previous = memoryLocks.get(key) ?? Promise.resolve()
  let release
  const current = new Promise((resolve) => {
    release = resolve
  })
  memoryLocks.set(key, previous.then(() => current))
  await previous
  try {
    return await fn()
  } finally {
    release()
    if (memoryLocks.get(key) === current) memoryLocks.delete(key)
  }
}

export function createFileStore(filePath) {
  const fallback = createMemoryStore()
  let loaded = false

  async function readState() {
    if (loaded) {
      return {
        cache: await fallback.listCache(),
        quota: await fallback.getQuota(),
        events: await fallback.listEvents(),
      }
    }
    try {
      const raw = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      for (const row of parsed.cache ?? []) await fallback.setCache(row.key, row)
      if (parsed.quota) await fallback.updateQuota(parsed.quota)
      for (const event of parsed.events ?? []) await fallback.addEvent(event)
    } catch {
      // First run or unreadable cache file: start empty.
    }
    loaded = true
    return {
      cache: await fallback.listCache(),
      quota: await fallback.getQuota(),
      events: await fallback.listEvents(),
    }
  }

  async function persist() {
    const state = {
      cache: await fallback.listCache(),
      quota: await fallback.getQuota(),
      events: await fallback.listEvents(),
    }
    await mkdir(dirname(filePath), { recursive: true })
    const tmp = `${filePath}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(state), 'utf8')
    await rename(tmp, filePath)
  }

  const wrap = (method) => async (...args) => {
    return withProcessLock('file-store', async () => {
      await readState()
      const result = await fallback[method](...args)
      if (method !== 'getCache' && method !== 'listCache' && method !== 'getQuota' && method !== 'listEvents') {
        await persist()
      }
      return result
    })
  }

  return {
    kind: 'file',
    getCache: wrap('getCache'),
    setCache: wrap('setCache'),
    listCache: wrap('listCache'),
    tryLock: wrap('tryLock'),
    unlock: wrap('unlock'),
    consumeQuota: wrap('consumeQuota'),
    getQuota: wrap('getQuota'),
    updateQuota: wrap('updateQuota'),
    addEvent: wrap('addEvent'),
    listEvents: wrap('listEvents'),
  }
}

export function createSupabaseStore(url, serviceKey) {
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const fromRow = (row) =>
    row
      ? {
          key: row.cache_key,
          dataset: row.dataset,
          payload: row.payload,
          fetchedAt: row.fetched_at,
          expiresAt: row.expires_at,
          status: row.status,
          error: row.last_error,
          lockUntil: row.lock_until,
          providerHitsToday: row.provider_hits_today,
        }
      : null

  return {
    kind: 'supabase',
    async getCache(key) {
      const { data, error } = await db.from('cricketdata_cache').select('*').eq('cache_key', key).maybeSingle()
      if (error) throw error
      return fromRow(data)
    },
    async setCache(key, row) {
      const payload = {
        cache_key: key,
        dataset: row.dataset ?? DATASETS.FEED,
        payload: row.payload ?? null,
        fetched_at: row.fetchedAt ?? null,
        expires_at: row.expiresAt ?? null,
        status: row.status ?? 'ok',
        last_error: row.error ?? null,
        lock_until: row.lockUntil ?? null,
        provider_hits_today: row.providerHitsToday ?? null,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await db.from('cricketdata_cache').upsert(payload, { onConflict: 'cache_key' }).select().maybeSingle()
      if (error) throw error
      return fromRow(data)
    },
    async listCache() {
      const { data, error } = await db.from('cricketdata_cache').select('*').order('cache_key')
      if (error) throw error
      return (data ?? []).map(fromRow)
    },
    async tryLock(key, ttlMs, now = new Date()) {
      const until = new Date(now.getTime() + ttlMs).toISOString()
      const { data: existing } = await db.from('cricketdata_cache').select('*').eq('cache_key', key).maybeSingle()
      if (!existing) {
        const { error } = await db.from('cricketdata_cache').insert({
          cache_key: key,
          dataset: key,
          status: 'empty',
          lock_until: until,
        })
        if (error) {
          if (error.code === '23505') return false
          throw error
        }
        return true
      }
      const locked = existing.lock_until && new Date(existing.lock_until).getTime() > now.getTime()
      if (locked) return false
      const { data, error } = await db
        .from('cricketdata_cache')
        .update({ lock_until: until, updated_at: now.toISOString() })
        .eq('cache_key', key)
        .or(`lock_until.is.null,lock_until.lte.${now.toISOString()}`)
        .select('cache_key')
      if (error) throw error
      return Array.isArray(data) && data.length > 0
    },
    async unlock(key) {
      const { error } = await db.from('cricketdata_cache').update({ lock_until: null }).eq('cache_key', key)
      if (error) throw error
    },
    async consumeQuota(limit, now = new Date()) {
      const day = utcDay(now)
      const { data, error } = await db.rpc('cricketdata_try_consume', {
        p_day: day,
        p_limit: limit,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      return {
        allowed: Boolean(row?.allowed),
        requestCount: Number(row?.request_count) || 0,
        day,
      }
    },
    async getQuota(now = new Date()) {
      const day = utcDay(now)
      const { data, error } = await db.from('cricketdata_quota').select('*').eq('day', day).maybeSingle()
      if (error) throw error
      return {
        day,
        requestCount: data?.request_count ?? 0,
        providerHitsToday: data?.provider_hits_today ?? null,
        providerHitsLimit: data?.provider_hits_limit ?? 100,
        lastError: data?.last_error ?? null,
        rateLimitedAt: data?.rate_limited_at ?? null,
        lastRequestAt: data?.last_request_at ?? null,
      }
    },
    async updateQuota(patch, now = new Date()) {
      const day = utcDay(now)
      const { data, error } = await db
        .from('cricketdata_quota')
        .upsert(
          {
            day,
            request_count: patch.requestCount,
            provider_hits_today: patch.providerHitsToday ?? null,
            provider_hits_limit: patch.providerHitsLimit ?? 100,
            last_error: patch.lastError ?? null,
            rate_limited_at: patch.rateLimitedAt ?? null,
            last_request_at: patch.lastRequestAt ?? now.toISOString(),
          },
          { onConflict: 'day' },
        )
        .select()
        .maybeSingle()
      if (error) throw error
      return {
        day,
        requestCount: data?.request_count ?? 0,
        providerHitsToday: data?.provider_hits_today ?? null,
        providerHitsLimit: data?.provider_hits_limit ?? 100,
        lastError: data?.last_error ?? null,
        rateLimitedAt: data?.rate_limited_at ?? null,
        lastRequestAt: data?.last_request_at ?? null,
      }
    },
    async addEvent(event) {
      await db.from('cricketdata_events').insert({
        dataset: event.dataset ?? null,
        action: event.action ?? 'info',
        detail: event.detail ?? null,
        ok: event.ok !== false,
      })
    },
    async listEvents() {
      const { data, error } = await db.from('cricketdata_events').select('*').order('created_at', { ascending: false }).limit(40)
      if (error) throw error
      return (data ?? []).map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        dataset: row.dataset,
        action: row.action,
        detail: row.detail,
        ok: row.ok,
      }))
    },
  }
}

export function createStore(config) {
  if (config.supabaseUrl && config.supabaseServiceKey) {
    return createSupabaseStore(config.supabaseUrl, config.supabaseServiceKey)
  }
  // Vercel functions cannot persist writes to the deployment filesystem.
  // Keep the public feed available between requests in one warm instance;
  // Supabase remains the durable cache when configured.
  if (process.env.VERCEL) return createMemoryStore()
  return createFileStore(config.cacheFile)
}

export { sleep }
