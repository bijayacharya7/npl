import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Inbox, X } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/* SEO                                                                        */
/* -------------------------------------------------------------------------- */

export function Seo({ title, description, noIndex = false }) {
  useEffect(() => {
    const base = 'NPL Fan Zone'
    document.title = title ? `${title} | ${base}` : `${base} | Your Home for Nepal Premier League Cricket`

    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }

    let robots = document.querySelector('meta[name="robots"]')
    if (noIndex) {
      if (!robots) {
        robots = document.createElement('meta')
        robots.setAttribute('name', 'robots')
        document.head.appendChild(robots)
      }
      robots.setAttribute('content', 'noindex, nofollow')
    } else if (robots) {
      robots.remove()
    }
  }, [title, description, noIndex])

  return null
}

/* -------------------------------------------------------------------------- */
/* Headings & breadcrumbs                                                     */
/* -------------------------------------------------------------------------- */

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }) {
  return (
    <header className="page-head">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      {(title || actions) && (
        <div className="page-head-row">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h1>{title}</h1>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </div>
      )}
    </header>
  )
}

export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="row" style={{ gap: '0.4rem' }}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {isLast || !item.to ? (
              <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* States                                                                     */
/* -------------------------------------------------------------------------- */

export function EmptyState({ title, children, icon: Icon = Inbox, action }) {
  return (
    <div className="empty-state">
      <Icon size={26} aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle size={26} aria-hidden="true" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading' }) {
  return (
    <div className="empty-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}&hellip;</p>
    </div>
  )
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-3" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton skeleton-card" />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="card card-pad" role="status" aria-label="Loading table">
      <div className="skeleton skeleton-title" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton skeleton-line" />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Data provenance note                                                       */
/* -------------------------------------------------------------------------- */

export function VerificationBadge({ verified = true, label }) {
  return (
    <span className={`badge ${verified ? 'badge-green' : 'badge-warn'}`}>
      {label ?? (verified ? 'Verified' : 'Unverified')}
    </span>
  )
}

export function DataNote({ children, variant = 'default' }) {
  return <div className={`notice ${variant === 'gold' ? 'notice-gold' : ''}`}>{children}</div>
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export function Modal({ open, onClose, title, children, footer, size = 'md', labelledBy }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const lastFocused = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    lastFocused.current = document.activeElement
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    const focusTimer = setTimeout(() => {
      const firstInput = dialogRef.current?.querySelector('input, select, textarea, button')
      firstInput?.focus()
    }, 30)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      clearTimeout(focusTimer)
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? titleId}
        ref={dialogRef}
      >
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working\u2026' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function FormError({ children }) {
  if (!children) return null
  return (
    <p className="error-text" role="alert">
      {children}
    </p>
  )
}

export function ArrowLink({ to, children }) {
  return (
    <Link to={to} className="card-link">
      {children}
      <ChevronRight size={14} aria-hidden="true" />
    </Link>
  )
}
