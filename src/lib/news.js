const EMPTY_NEWS = { articles: [], fetchedAt: null }

export async function fetchExternalNews() {
  try {
    const response = await fetch('/api/news', { headers: { Accept: 'application/json' } })
    if (!response.ok) return EMPTY_NEWS
    const result = await response.json()
    return Array.isArray(result.articles) ? result : EMPTY_NEWS
  } catch (error) {
    console.error('[NPL Fan Zone] Could not load external news:', error)
    return EMPTY_NEWS
  }
}
