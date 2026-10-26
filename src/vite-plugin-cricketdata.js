import { handleCricketdataRequest } from './server/cricketdata/http.js'
import { timingSafeEqual } from 'node:crypto'

function secureMatch(a, b) {
  const left = Buffer.from(String(a ?? ''))
  const right = Buffer.from(String(b ?? ''))
  return left.length === right.length && timingSafeEqual(left, right)
}

async function handleAdminLogin(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end()
    return
  }
  const email = process.env.NPL_ADMIN_EMAIL
  const password = process.env.NPL_ADMIN_PASSWORD
  if (!email || !password) {
    res.statusCode = 503
    res.end(JSON.stringify({ error: 'Admin login is not configured.' }))
    return
  }
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 4096) {
      res.statusCode = 413
      res.end()
      return
    }
  }
  let body
  try { body = JSON.parse(raw) } catch { body = {} }
  const valid = secureMatch(String(body.email ?? '').trim().toLowerCase(), email.trim().toLowerCase())
    && secureMatch(body.password, password)
  res.statusCode = valid ? 200 : 401
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(valid ? { ok: true } : { error: 'Invalid credentials.' }))
}

function attach(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split('?')[0] ?? ''
    if (url === '/api/admin/login') {
      try {
        await handleAdminLogin(req, res)
      } catch {
        if (!res.headersSent) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Invalid login request.' }))
        }
      }
      return
    }
    if (!url.startsWith('/api/cricketdata')) {
      next()
      return
    }
    try {
      await handleCricketdataRequest(req, res)
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'CricketData.org gateway failed.' }))
      }
      console.error('[NPL Fan Zone] CricketData gateway error:', error?.message)
    }
  })
}

export function cricketdataDevPlugin() {
  return {
    name: 'npl-cricketdata-api',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}
