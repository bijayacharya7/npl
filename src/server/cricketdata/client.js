import { PROVIDER } from './config.js'

const RETRYABLE = new Set([500, 502, 503, 504])

function headersOf(response) {
  const retryAfter = response.headers.get('retry-after')
  return { retryAfter }
}

function redactUrl(url) {
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('apikey')
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return '[invalid-url]'
  }
}

export function createProviderClient({ apiKey, timeoutMs, fetchImpl, consumeQuota, onQuotaInfo, dailyLimit }) {
  const fetchFn = fetchImpl ?? fetch

  async function request(path, params = {}, { retry = true } = {}) {
    if (!apiKey) {
      const error = new Error('CRICKETDATA_API_KEY is not configured on the server.')
      error.code = 'NO_KEY'
      throw error
    }

    const quota = await consumeQuota()
    if (!quota.allowed) {
      const error = new Error(`Internal CricketData.org budget reached (${quota.requestCount}/${dailyLimit} today).`)
      error.code = 'QUOTA'
      error.quota = quota
      throw error
    }

    const url = new URL(`${PROVIDER.baseUrl}${path}`)
    url.searchParams.set('apikey', apiKey)
    url.searchParams.set('offset', String(params.offset ?? 0))
    for (const [key, value] of Object.entries(params)) {
      if (key === 'offset' || value === undefined || value === null) continue
      url.searchParams.set(key, String(value))
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let response
    try {
      response = await fetchFn(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    } catch (err) {
      clearTimeout(timer)
      if (retry && err?.name === 'AbortError') {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return request(path, params, { retry: false })
      }
      const error = new Error('CricketData.org request timed out or failed to connect.')
      error.code = 'NETWORK'
      error.cause = err
      throw error
    }
    clearTimeout(timer)

    const { retryAfter } = headersOf(response)
    let json = {}
    try {
      json = await response.json()
    } catch {
      json = {}
    }

    if (json?.info) await onQuotaInfo?.(json.info)

    if (response.status === 429 || /rate limit/i.test(json?.reason ?? '')) {
      const error = new Error('CricketData.org rate-limited the request.')
      error.code = 'RATE_LIMIT'
      error.retryAfter = retryAfter
      error.body = json
      throw error
    }

    if (response.status === 401 || json?.status === 'failure') {
      const error = new Error(json?.reason || `CricketData.org returned HTTP ${response.status}`)
      error.code = response.status === 401 ? 'AUTH' : 'PROVIDER'
      error.status = response.status
      error.body = json
      throw error
    }

    if (!response.ok) {
      if (retry && RETRYABLE.has(response.status)) {
        const wait = retryAfter ? Math.min(Number(retryAfter) * 1000 || 800, 4000) : 600
        await new Promise((resolve) => setTimeout(resolve, wait))
        return request(path, params, { retry: false })
      }
      const error = new Error(`CricketData.org HTTP ${response.status}`)
      error.code = 'HTTP'
      error.status = response.status
      throw error
    }

    return {
      data: json.data,
      info: json.info ?? {},
      status: json.status,
      path: redactUrl(url),
    }
  }

  return { request }
}
