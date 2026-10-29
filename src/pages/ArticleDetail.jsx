import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, UserRound } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Seo, EmptyState, PageHeader } from '../components/ui.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { formatLongDate } from '../lib/format.js'

export default function ArticleDetail() {
  const { slug } = useParams()
  const { articles, publishedArticles, teamsById, playersById } = useData()
  const { user } = useAuth()
  const article = (user?.isAdmin ? articles : publishedArticles).find((item) => item.slug === slug)

  if (!article) {
    return (
      <div className="container page">
        <Seo title="Article not found" noIndex />
        <EmptyState title="Article not found">
          It may have been unpublished or removed.{' '}
          <Link to="/news" className="text-link">
            Back to news
          </Link>
          .
        </EmptyState>
      </div>
    )
  }

  const team = article.relatedTeamId ? teamsById[article.relatedTeamId] : null
  const player = article.relatedPlayerId ? playersById[article.relatedPlayerId] : null
  const content = Array.isArray(article.content) ? article.content : []

  return (
    <div className="container page">
      <Seo
        title={article.seoTitle || article.title}
        description={article.seoDescription || article.excerpt}
        noIndex={article.status !== 'published'}
      />
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'News', to: '/news' }, { label: article.category }]}
      />

      <article className="container-narrow" style={{ paddingInline: 0 }}>
        <div className="article-meta" style={{ marginBottom: '0.7rem' }}>
          <span className="badge badge-gold">{article.category}</span>
          {article.isExternal && <span className="badge badge-muted">External report</span>}
          {article.source && <span className="badge badge-muted">Sourced</span>}
          {article.status === 'draft' && <span className="badge badge-warn">Draft preview</span>}
        </div>

        <h1 style={{ fontSize: 'clamp(2.1rem, 4.6vw, 3.4rem)', marginBottom: '0.8rem' }}>{article.title}</h1>
        <p className="article-meta" style={{ marginBottom: '1.4rem' }}>
          <UserRound size={13} aria-hidden="true" />
          <span>{article.author}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{formatLongDate(article.publishedAt)}</span>
        </p>

        {article.coverImageUrl ? (
          <>
            <img
              className="article-cover"
              src={article.coverImageUrl}
              alt=""
              style={{ aspectRatio: '16 / 7', marginBottom: '1.6rem' }}
            />
            {article.imageCredit && (
              <p className="tiny muted" style={{ marginTop: '-1.2rem', marginBottom: '1.2rem' }}>
                Image: {article.imageCredit}
              </p>
            )}
          </>
        ) : (
          <div className="article-placeholder" style={{ aspectRatio: '16 / 7', marginBottom: '1.6rem' }}>
            No cover image — add a licensed image in the admin dashboard
          </div>
        )}

        <div className="prose">
          <p className="prose-lead">{article.excerpt}</p>
          {content.map((block, index) =>
            block.type === 'heading' ? (
              <h2 key={index}>{block.text}</h2>
            ) : (
              <p key={index}>{block.text}</p>
            ),
          )}
        </div>

        {(team || player) && (
          <div className="notice" style={{ marginTop: '1.5rem' }}>
            <span className="small">
              Related:{' '}
              {team && (
                <Link to={`/teams/${team.id}`} className="text-link">
                  <TeamBadge team={team} size="sm" />{' '}
                  {team.name}
                </Link>
              )}
              {team && player && ' · '}
              {player && (
                <Link to={`/players/${player.id}`} className="text-link">
                  {player.name}
                </Link>
              )}
            </span>
          </div>
        )}

        {article.source && (
          <div className="notice" style={{ marginTop: '1.2rem' }}>
            <span className="small">
              This is a short summary shown by NPL Fan Zone. Read the full report at{' '}
              <a className="text-link" href={article.source.url} target="_blank" rel="noreferrer noopener">
                {article.source.label}
              </a>
              .
            </span>
          </div>
        )}

        <div className="row" style={{ marginTop: '1.8rem' }}>
          <Link to="/news" className="btn btn-outline btn-sm">
            <ArrowLeft size={14} aria-hidden="true" />
            All articles
          </Link>
          {user?.isAdmin && (
            <Link to={`/admin/articles?edit=${article.id}`} className="btn btn-ghost btn-sm">
              <Pencil size={13} aria-hidden="true" />
              Edit article
            </Link>
          )}
        </div>
      </article>
    </div>
  )
}
