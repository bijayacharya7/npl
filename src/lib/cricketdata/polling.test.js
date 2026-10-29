import { describe, expect, it } from 'vitest'
import { feedPollingInterval } from './polling.js'

const minute = 60_000
const hour = 60 * minute

describe('feedPollingInterval', () => {
  const now = Date.parse('2026-10-26T12:00:00Z')

  it('polls every 30 seconds during a scheduled fixture window while waiting for provider confirmation', () => {
    const matches = [{ status: 'upcoming', startTime: new Date(now - 20 * minute).toISOString() }]
    expect(feedPollingInterval({ meta: { liveFresh: false } }, matches, now)).toBe(30_000)
  })

  it('polls every 30 seconds when the provider confirms live data', () => {
    expect(feedPollingInterval({ meta: { liveFresh: true } }, [], now)).toBe(30_000)
  })

  it('uses the slower idle interval outside scheduled match windows', () => {
    const matches = [{ status: 'upcoming', startTime: new Date(now + 8 * hour).toISOString() }]
    expect(feedPollingInterval({ meta: { liveFresh: false } }, matches, now)).toBe(10 * minute)
  })
})
