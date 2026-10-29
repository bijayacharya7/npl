import { fetchExternalNews } from '../src/server/news.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Only GET is supported.' })
  }

  try {
    const articles = await fetchExternalNews()
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800')
    return res.status(200).json({ articles, fetchedAt: new Date().toISOString() })
  } catch (error) {
    console.error('[NPL Fan Zone] External news feed failed:', error)
    return res.status(502).json({ error: 'External news is temporarily unavailable.' })
  }
}
