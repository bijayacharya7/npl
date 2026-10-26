import { createClient } from '@supabase/supabase-js'
import { DATASETS } from './config.js'
import { getCricketdataService } from './service.js'

const MAX_BODY_BYTES = 16 * 1024
const VALID_DATASETS = new Set(Object.values(DATASETS))

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function readUrl(req) {
  const host = req.headers.host || 'localhost'
  return new URL(req.url, `http://${host}`)
}

async function readBody(req) {
  if (req.body) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large.')
      error.status = 413
      throw error
    }
    try {
      return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
    } catch {
      const error = new Error('Request body must be valid JSON.')
      error.status = 400
      throw error
    }
  }
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk)
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large.')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    const error = new Error('Request body must be valid JSON.')
    error.status = 400
    throw error
  }
}

function bearer(req) {
  const header = req.headers.authorization || req.headers.Authorization || ''
  const match = String(header).match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? ''
}

async function isAdminRequest(req, config) {
  if (config.cronSecret && bearer(req) === config.cronSecret) return { ok: true, via: 'cron' }

  if (config.supabaseUrl && config.supabaseServiceKey) {
    const token = bearer(req)
    if (!token) return { ok: false }
    const auth = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: userData, error } = await auth.auth.getUser(token)
    if (error || !userData?.user) return { ok: false }
    const { data: role } = await auth.from('user_roles').select('role').eq('user_id', userData.user.id).maybeSingle()
    return { ok: role?.role === 'admin', via: 'supabase' }
  }

  // The header is only a local development convenience. Never trust it in a
  // deployed environment where callers can set arbitrary request headers.
  return { ok: config.allowDemoAdmin === true && req.headers['x-npl-demo-admin'] === '1', via: 'demo' }
}

export async function handleCricketdataRequest(req, res) {
  const service = getCricketdataService()
  const url = readUrl(req)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const job = url.searchParams.get('job')
  const view = url.searchParams.get('view')

  try {
    if (req.method === 'GET' && (path === '/api/cricketdata' || path.endsWith('/cricketdata')) && view !== 'admin' && job !== 'refresh') {
      const feed = await service.getFeed({ allowRefresh: true })
      return sendJson(res, 200, feed)
    }

    const admin = await isAdminRequest(req, service.config)
    if (!admin.ok) {
      return sendJson(res, 401, { error: 'Admin authentication is required.' })
    }

    if (req.method === 'GET' && (view === 'admin' || path.endsWith('/cricketdata-admin'))) {
      const status = await service.adminStatus()
      return sendJson(res, 200, status)
    }

    if (
      req.method === 'POST' ||
      job === 'refresh' ||
      path.endsWith('/cricketdata-refresh')
    ) {
      const body = req.method === 'POST' ? await readBody(req) : {}
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return sendJson(res, 400, { error: 'Request body must be a JSON object.' })
      }
      const dataset = body.dataset ?? url.searchParams.get('dataset') ?? DATASETS.FEED
      if (typeof dataset !== 'string' || !VALID_DATASETS.has(dataset)) {
        return sendJson(res, 400, { error: 'Unsupported CricketData dataset.' })
      }
      const quota = await service.quotaSnapshot()
      if (quota.exhausted) {
        return sendJson(res, 429, {
          error: 'Refreshing now would exceed the remaining CricketData.org budget.',
          quota,
        })
      }
      const feed = await service.refresh(dataset, { force: true, source: admin.via === 'cron' ? 'cron' : 'manual' })
      return sendJson(res, 200, { ok: true, dataset, feed, quota: await service.quotaSnapshot() })
    }

    return sendJson(res, 405, { error: 'Method not allowed.' })
  } catch (error) {
    const status = error.status || (error.code === 'QUOTA' ? 429 : 500)
    return sendJson(res, status, {
      error: status >= 500 ? 'CricketData.org request failed.' : error.message,
      code: error.code ?? 'ERROR',
    })
  }
}

export default async function vercelHandler(req, res) {
  return handleCricketdataRequest(req, res)
}
