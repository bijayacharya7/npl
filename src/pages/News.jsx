import { useMemo, useState } from 'react'
import { Newspaper, Search } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Seo, PageHeader, EmptyState, CardSkeleton } from '../components/ui.jsx'
import { ArticleCard } from '../components/ArticleCard.jsx'

export default function News() {
  const { publishedArticles, loading } = useData()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')

  const categories = useMemo(
    () => [...new Set(publishedArticles.map((article) => article.category))].sort(),
    [publishedArticles],
  )

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return publishedArticles.filter((article) => {
      if (category !== 'all' && article.category !== category) return false
      if (!term) return true
      return (
        article.title.toLowerCase().includes(term) ||
        article.excerpt.toLowerCase().includes(term) ||
        article.author.toLowerCase().includes(term)
      )
    })
  }, [publishedArticles, category, query])

  return (
    <div className="container page">
      <Seo
        title="NPL 2026 news, guides and explainers"
        description="Independent Nepal Premier League coverage: team guides, tournament explainers and fan-focused analysis."
      />
      <PageHeader
        eyebrow="From the fan zone"
        title="News &amp; explainers"
        description="Original editorial written for this independent fan project. Development articles are labelled as sample content — no fabricated quotes and no copied reporting."
      />

      <div className="row" style={{ marginBottom: '1.4rem', gap: '0.5rem' }}>
        <div className="row" style={{ flex: 1 }}>
          {['all', ...categories].map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${category === item ? 'active' : ''}`}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
            >
              {item === 'all' ? 'All' : item}
            </button>
          ))}
        </div>
        <div className="input-with-action" style={{ maxWidth: 300, width: '100%' }}>
          <div className="row" style={{ width: '100%' }}>
            <Search size={15} aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder="Search articles"
              aria-label="Search articles"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No articles match" icon={Newspaper}>
          Try another category, or clear the search.
        </EmptyState>
      ) : (
        <div className="grid grid-3">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
