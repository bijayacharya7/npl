import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ service: null }))

vi.mock('./service.js', () => ({
  getCricketdataService: () => mocks.service,
}))

import { handleCricketdataRequest } from './http.js'

function request({ method = 'GET', url = '/api/cricketdata?view=admin', headers = {}, body } = {}) {
  return { method, url, headers, body }
}

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name] = value },
    end(body) { this.body = body },
    json() { return JSON.parse(this.body) },
  }
}

function setup(config = {}) {
  const calls = { status: 0, quota: 0, refresh: 0, refreshArgs: null }
  mocks.service = {
    config: { allowDemoAdmin: false, cronSecret: '', supabaseUrl: '', supabaseServiceKey: '', ...config },
    async getFeed() { return { public: true } },
    async adminStatus() { calls.status++; return { ok: true } },
    async quotaSnapshot() { calls.quota++; return { exhausted: false } },
    async refresh(dataset, options) { calls.refresh++; calls.refreshArgs = [dataset, options]; return { dataset, options } },
  }
  return calls
}

describe('CricketData HTTP authorization and validation', () => {
  beforeEach(() => { mocks.service = null })

  it('rejects a spoofed Vercel cron header without contacting admin handlers', async () => {
    const calls = setup({ cronSecret: 'secret' })
    const res = response()
    await handleCricketdataRequest(request({ headers: { 'x-vercel-cron': '1' } }), res)
    expect(res.statusCode).toBe(401)
    expect(calls.status).toBe(0)
  })

  it('rejects demo admin headers in production mode', async () => {
    const calls = setup({ allowDemoAdmin: false })
    const res = response()
    await handleCricketdataRequest(request({ headers: { 'x-npl-demo-admin': '1' } }), res)
    expect(res.statusCode).toBe(401)
    expect(calls.status).toBe(0)
  })

  it('allows the demo header only when explicitly enabled for local development', async () => {
    setup({ allowDemoAdmin: true })
    const res = response()
    await handleCricketdataRequest(request({ headers: { 'x-npl-demo-admin': '1' } }), res)
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
  })

  it('accepts a cron bearer secret and labels refresh source as cron', async () => {
    const calls = setup({ cronSecret: 'secret' })
    const res = response()
    await handleCricketdataRequest(request({
      method: 'POST', url: '/api/cricketdata',
      headers: { authorization: 'Bearer secret' }, body: { dataset: 'npl_feed' },
    }), res)
    expect(res.statusCode).toBe(200)
    expect(calls.refresh).toBe(1)
    expect(calls.refreshArgs).toEqual(['npl_feed', { force: true, source: 'cron' }])
  })

  it('rejects unsupported datasets before quota use or refresh', async () => {
    const calls = setup({ allowDemoAdmin: true })
    const res = response()
    await handleCricketdataRequest(request({
      method: 'POST', url: '/api/cricketdata',
      headers: { 'x-npl-demo-admin': '1' }, body: { dataset: '../../secrets' },
    }), res)
    expect(res.statusCode).toBe(400)
    expect(calls.quota).toBe(0)
    expect(calls.refresh).toBe(0)
  })

  it('rejects malformed and oversized request bodies', async () => {
    setup({ allowDemoAdmin: true })
    const malformed = response()
    await handleCricketdataRequest(request({
      method: 'POST', url: '/api/cricketdata',
      headers: { 'x-npl-demo-admin': '1' }, body: '{bad json',
    }), malformed)
    expect(malformed.statusCode).toBe(400)

    const oversized = response()
    await handleCricketdataRequest(request({
      method: 'POST', url: '/api/cricketdata',
      headers: { 'x-npl-demo-admin': '1' }, body: { dataset: 'npl_feed', padding: 'x'.repeat(17 * 1024) },
    }), oversized)
    expect(oversized.statusCode).toBe(413)
  })
})
