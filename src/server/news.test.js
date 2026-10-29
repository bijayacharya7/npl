import { describe, expect, it } from 'vitest'
import { distinctCoverImages, parseNewsRss } from './news.js'

describe('external news RSS parsing', () => {
  it('creates attributed summaries without copying the full article', () => {
    const articles = parseNewsRss(
      `<rss><channel><item>
        <title><![CDATA[NPL match report &amp; preview]]></title>
        <link>https://publisher.example/npl-report</link>
        <pubDate>Thu, 29 Oct 2026 10:00:00 GMT</pubDate>
        <source>Publisher Daily</source>
        <description><![CDATA[<p>A short report about the Nepal Premier League.</p>]]></description>
      </item></channel></rss>`,
      'NPL Nepal cricket',
    )

    expect(articles).toHaveLength(1)
    expect(articles[0]).toMatchObject({
      title: 'NPL match report & preview',
      author: 'Publisher Daily',
      isExternal: true,
      source: { label: 'Publisher Daily', url: 'https://publisher.example/npl-report' },
    })
    expect(articles[0].excerpt).toBe('A short report about the Nepal Premier League.')
  })

  it('reads the publisher image from RSS media metadata', () => {
    const articles = parseNewsRss(
      `<rss><channel><item>
        <title>NPL image report</title>
        <link>https://publisher.example/npl-image</link>
        <media:content url="https://publisher.example/images/npl.jpg" />
      </item></channel></rss>`,
      'NPL Nepal cricket',
    )

    expect(articles[0].coverImageUrl).toBe('https://publisher.example/images/npl.jpg')
  })

  it('keeps repeated external news cover images visually distinct', () => {
    const articles = distinctCoverImages([
      { coverImageUrl: 'https://shared.example/image.jpg' },
      { coverImageUrl: 'https://shared.example/image.jpg' },
      { coverImageUrl: 'https://shared.example/image.jpg' },
    ])
    expect(new Set(articles.map((article) => article.coverImageUrl)).size).toBe(articles.length)
  })
})
