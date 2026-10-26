import { beforeEach, describe, expect, it } from 'vitest'
import { getSession, signIn, signOut } from './localAuth.js'
import { localStore } from './local.js'

const values = new Map()

beforeEach(() => {
  values.clear()
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
  globalThis.fetch = async (_url, options) => {
    const credentials = JSON.parse(options.body)
    const valid = credentials.email === 'admin@example.test' && credentials.password === 'test-secret'
    return { ok: valid, status: valid ? 200 : 401 }
  }
})

describe('single-admin local access', () => {
  it('accepts only credentials verified by the server', async () => {
    await expect(signIn({ id: 'admin@example.test', password: 'test-secret' })).resolves.toMatchObject({
      userId: 'admin',
      role: 'admin',
    })
    await expect(signIn({ id: 'fan@example.test', password: 'test-secret' })).rejects.toThrow('Incorrect email or password.')
    await expect(signIn({ id: 'admin@example.test', password: 'wrong' })).rejects.toThrow('Incorrect email or password.')
  })

  it('restores and clears the admin session', async () => {
    await signIn({ id: 'admin@example.test', password: 'test-secret' })
    expect(getSession()?.role).toBe('admin')
    signOut()
    expect(getSession()).toBeNull()
  })

  it('allows admin news edits and blocks edits without a session', async () => {
    await expect(localStore.saveArticle({
      title: 'Local admin article',
      excerpt: 'A local article excerpt for this admin test.',
      author: 'Administrator',
      status: 'draft',
      content: [],
    })).rejects.toThrow('Admin access required.')

    await signIn({ id: 'admin@example.test', password: 'test-secret' })
    const article = await localStore.saveArticle({
      title: 'Local admin article',
      excerpt: 'A local article excerpt for this admin test.',
      author: 'Administrator',
      status: 'draft',
      content: [],
    })
    expect(article.status).toBe('draft')
    expect(article.slug).toBe('local-admin-article')
    await localStore.deleteArticle(article.id)
  })
})
