import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { ConfirmDialog, FormError, Modal } from '../../components/ui.jsx'
import { ImageUploader } from '../../components/ImageUploader.jsx'
import { TeamBadge } from '../../components/TeamBadge.jsx'
import { ARTICLE_CATEGORIES } from '../../data/articles.js'
import { slugify } from '../../data/players.js'
import { formatDateTime } from '../../lib/format.js'

function toNptInput(iso) {
  if (!iso) return ''
  return new Date(new Date(iso).getTime() + 5.75 * 60 * 60 * 1000).toISOString().slice(0, 16)
}

function blocksToText(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks.map((block) => (block.type === 'heading' ? `## ${block.text}` : block.text)).join('\n\n')
}

function textToBlocks(text) {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      chunk.startsWith('## ')
        ? { type: 'heading', text: chunk.slice(3).trim() }
        : { type: 'paragraph', text: chunk },
    )
}

const BLANK = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Explainer',
  author: 'NPL Fan Zone Editorial',
  status: 'draft',
  isSample: true,
  publishedAt: toNptInput(new Date().toISOString()),
  coverImageUrl: null,
  relatedTeamId: '',
  relatedPlayerId: '',
  seoTitle: '',
  seoDescription: '',
  body: '',
}

export default function AdminArticles() {
  const { articles, players, teams, teamsById, store, refresh } = useData()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [searchParams] = useSearchParams()
  const openedEditRef = useRef(null)
  const editId = searchParams.get('edit')

  useEffect(() => {
    if (!editId || openedEditRef.current === editId) return
    const article = articles.find((item) => item.id === editId)
    if (!article) return
    openedEditRef.current = editId
    setError(null)
    setEditing({
      ...article,
      publishedAt: toNptInput(article.publishedAt),
      relatedTeamId: article.relatedTeamId ?? '',
      relatedPlayerId: article.relatedPlayerId ?? '',
      body: blocksToText(article.content),
    })
  }, [editId, articles])

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setEditing((current) => ({ ...current, [field]: value }))
  }

  const open = (article) => {
    setError(null)
    if (article) {
      setEditing({
        ...article,
        publishedAt: toNptInput(article.publishedAt),
        relatedTeamId: article.relatedTeamId ?? '',
        relatedPlayerId: article.relatedPlayerId ?? '',
        body: blocksToText(article.content),
      })
    } else {
      setEditing({ ...BLANK })
    }
  }

  const save = async (event) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const slug = slugify(editing.slug || editing.title)
      const payload = {
        ...editing,
        id: editing.id ?? slug,
        slug,
        content: textToBlocks(editing.body),
        publishedAt: editing.publishedAt ? `${editing.publishedAt}:00+05:45` : new Date().toISOString(),
        relatedTeamId: editing.relatedTeamId || null,
        relatedPlayerId: editing.relatedPlayerId || null,
      }
      delete payload.body
      await store.saveArticle(payload)
      await store.logActivity(editing.id ? 'Updated article' : 'Created article', 'articles', editing.title)
      await refresh()
      toast.success('Article saved.')
      setEditing(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await store.deleteArticle(deleting.id)
      await store.logActivity('Deleted article', 'articles', deleting.title)
      await refresh()
      toast.success('Article deleted.')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">Editorial</span>
          <h1>News articles</h1>
          <p className="small muted">
            Draft and publish original articles. Use <code>## </code> on its own line for a subheading and a
            blank line between paragraphs.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => open(null)}>
          <Plus size={14} aria-hidden="true" />
          New article
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table admin-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Published</th>
              <th scope="col">Label</th>
              <th scope="col" className="num">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="small muted">
                  No articles yet. Publish your first explainer or match preview.
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <strong>{article.title}</strong>
                    <div className="tiny muted">/{article.slug}</div>
                  </td>
                  <td>{article.category}</td>
                  <td>
                    <span className={`badge ${article.status === 'published' ? 'badge-green' : 'badge-muted'}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="small">{formatDateTime(article.publishedAt)}</td>
                  <td>{article.isSample ? <span className="badge badge-warn">Sample</span> : '\u2014'}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => open(article)}>
                        <Pencil size={13} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleting(article)}
                        aria-label={`Delete ${article.title}`}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => !busy && setEditing(null)}
        title={editing?.id ? 'Edit article' : 'New article'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="article-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving\u2026' : 'Save article'}
            </button>
          </>
        }
      >
        {editing && (
          <form id="article-form" className="form" onSubmit={save}>
            <div className="form-grid">
              <div className="field field-full">
                <label className="label" htmlFor="article-title">
                  Title *
                </label>
                <input id="article-title" className="input" required value={editing.title} onChange={update('title')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="article-slug">
                  URL slug
                </label>
                <input
                  id="article-slug"
                  className="input"
                  value={editing.slug}
                  onChange={update('slug')}
                  placeholder="auto-generated from the title"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="article-category">
                  Category
                </label>
                <select id="article-category" className="select" value={editing.category} onChange={update('category')}>
                  {ARTICLE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="article-author">
                  Author
                </label>
                <input id="article-author" className="input" required value={editing.author} onChange={update('author')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="article-published">
                  Publish date (NPT)
                </label>
                <input
                  id="article-published"
                  className="input"
                  type="datetime-local"
                  value={editing.publishedAt}
                  onChange={update('publishedAt')}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="article-status">
                  Status
                </label>
                <select id="article-status" className="select" value={editing.status} onChange={update('status')}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="field">
                <label className="checkbox-row" htmlFor="article-sample">
                  <input
                    id="article-sample"
                    type="checkbox"
                    checked={Boolean(editing.isSample)}
                    onChange={update('isSample')}
                  />
                  Mark as sample/development content
                </label>
              </div>
              <div className="field">
                <label className="label" htmlFor="article-team">
                  Related team
                </label>
                <select id="article-team" className="select" value={editing.relatedTeamId ?? ''} onChange={update('relatedTeamId')}>
                  <option value="">None</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {editing.relatedTeamId && teamsById[editing.relatedTeamId] && <TeamBadge team={teamsById[editing.relatedTeamId]} size="sm" />}
              </div>
              <div className="field">
                <label className="label" htmlFor="article-player">
                  Related player
                </label>
                <select
                  id="article-player"
                  className="select"
                  value={editing.relatedPlayerId ?? ''}
                  onChange={update('relatedPlayerId')}
                >
                  <option value="">None</option>
                  {players
                    .filter((player) => !editing.relatedTeamId || player.teamId === editing.relatedTeamId)
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="article-excerpt">
                  Excerpt *
                </label>
                <textarea
                  id="article-excerpt"
                  className="textarea"
                  required
                  style={{ minHeight: 70 }}
                  value={editing.excerpt}
                  onChange={update('excerpt')}
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="article-body">
                  Article body
                </label>
                <textarea
                  id="article-body"
                  className="textarea"
                  style={{ minHeight: 220 }}
                  value={editing.body}
                  onChange={update('body')}
                  placeholder={'Opening paragraph.\n\n## A subheading\n\nAnother paragraph.'}
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="article-seo-title">
                  SEO title
                </label>
                <input
                  id="article-seo-title"
                  className="input"
                  value={editing.seoTitle ?? ''}
                  onChange={update('seoTitle')}
                  placeholder="Optional. Falls back to the title."
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="article-seo-desc">
                  SEO description
                </label>
                <textarea
                  id="article-seo-desc"
                  className="textarea"
                  style={{ minHeight: 70 }}
                  value={editing.seoDescription ?? ''}
                  onChange={update('seoDescription')}
                  placeholder="Optional. Falls back to the excerpt."
                />
              </div>
              <div className="field-full">
                <ImageUploader
                  value={editing.coverImageUrl}
                  onChange={(url) => setEditing((current) => ({ ...current, coverImageUrl: url }))}
                  folder="articles"
                  label="Cover image (licensed only)"
                />
              </div>
            </div>
            <FormError>{error}</FormError>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete "${deleting?.title ?? 'article'}"?`}
        message="This permanently removes the article. Drafts and published posts are affected equally."
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  )
}
