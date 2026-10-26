import { Link } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import { formatLongDate } from '../lib/format.js'
import { useData } from '../context/DataContext.jsx'
import { TeamBadge } from './TeamBadge.jsx'

export function ArticleCard({ article }) {
  const { teamsById } = useData()
  const relatedTeam = article.relatedTeamId ? teamsById[article.relatedTeamId] : null

  return (
    <article className="article-card">
      {article.coverImageUrl ? (
        <img
          className="article-cover"
          src={article.coverImageUrl}
          alt={article.title}
          loading="lazy"
          width="640"
          height="320"
        />
      ) : (
        <div className="article-placeholder" aria-hidden="true">
          <Newspaper size={22} />
        </div>
      )}
      <div className="article-meta">
        <span className="badge badge-gold">{article.category}</span>
        {article.isSample && <span className="badge badge-muted">Sample content</span>}
        {relatedTeam && <span className="team-label"><TeamBadge team={relatedTeam} size="sm" /><span>{relatedTeam.name}</span></span>}
      </div>
      <h3>
        <Link to={`/news/${article.slug}`}>{article.title}</Link>
      </h3>
      <p>{article.excerpt}</p>
      <div className="article-meta">
        <span>{article.author}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{formatLongDate(article.publishedAt)}</span>
      </div>
    </article>
  )
}
