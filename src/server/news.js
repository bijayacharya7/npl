const FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=Nepal+Premier+League+cricket&hl=en-US&gl=US&ceid=US:en',
    query: 'Nepal Premier League cricket',
  },
  {
    url: 'https://news.google.com/rss/search?q=NPL+Nepal+cricket&hl=en-US&gl=US&ceid=US:en',
    query: 'NPL Nepal cricket',
  },
]

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80'
const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map()

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim()
}

function tagValue(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeXml(match[1]) : ''
}

function tagAttribute(item, tag, attribute) {
  const match = item.match(new RegExp(`<${tag}\\b[^>]*\\b${attribute}="([^"]+)"`, 'i'))
  return match ? decodeXml(match[1]) : ''
}

function stripMarkup(value) {
  return decodeXml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sourceFromItem(item, fallback = 'News publisher') {
  const source = tagValue(item, 'source')
  return source || fallback
}

function imageFromItem(item) {
  return (
    tagAttribute(item, 'media:content', 'url') ||
    tagAttribute(item, 'media:thumbnail', 'url') ||
    tagAttribute(item, 'enclosure', 'url') ||
    FALLBACK_IMAGE
  )
}

function imageFromHtml(html, pageUrl) {
  const match =
    html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i)
  if (!match?.[1]) return null
  try {
    const url = new URL(decodeXml(match[1]), pageUrl)
    return /^https?:$/i.test(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

async function enrichWithPublisherImage(article) {
  if (article.coverImageUrl !== FALLBACK_IMAGE) return article
  try {
    const response = await fetch(article.source.url, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return article
    const html = await response.text()
    const image = imageFromHtml(html, response.url)
    return image ? { ...article, coverImageUrl: image, imageCredit: article.author } : article
  } catch {
    return article
  }
}

export function parseNewsRss(xml, feedQuery) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []
  return items
    .map((item) => {
      const title = tagValue(item, 'title')
      const url = tagValue(item, 'link')
      const publishedAt = tagValue(item, 'pubDate') || tagValue(item, 'published')
      const source = sourceFromItem(item)
      const description = stripMarkup(tagValue(item, 'description'))
      if (!title || !url) return null

      const id = `external-${encodeURIComponent(url).replace(/%/g, '').toLowerCase()}`
      return {
        id,
        slug: id,
        title,
        excerpt: description.slice(0, 280) || `Read the latest NPL report from ${source}.`,
        category: 'External Report',
        author: source,
        publishedAt: Number.isNaN(Date.parse(publishedAt)) ? new Date().toISOString() : new Date(publishedAt).toISOString(),
        coverImageUrl: imageFromItem(item),
        imageCredit: source,
        relatedTeamId: null,
        relatedPlayerId: null,
        isSample: false,
        isExternal: true,
        status: 'published',
        seoTitle: title,
        seoDescription: description.slice(0, 160),
        content: [{ type: 'paragraph', text: description || `This report was published by ${source}.` }],
        source: { label: source, url },
        feedQuery,
      }
    })
    .filter(Boolean)
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`News feed returned HTTP ${response.status}.`)
  const articles = parseNewsRss(await response.text(), feed.query)
  return Promise.all(articles.map(enrichWithPublisherImage))
}

export async function fetchExternalNews() {
  const now = Date.now()
  const cached = cache.get('external-news')
  if (cached && cached.expiresAt > now) return cached.items

  const results = await Promise.allSettled(FEEDS.map(fetchFeed))
  const items = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  const unique = [...new Map(items.map((item) => [item.source.url, item])).values()]
    .filter((item) => /nepal premier league|\bnpl\b/i.test(`${item.title} ${item.excerpt}`))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 30)

  cache.set('external-news', { expiresAt: now + CACHE_TTL_MS, items: unique })
  return unique
}
