import { Link } from 'react-router-dom'
import { FileWarning, ShieldCheck } from 'lucide-react'
import { Seo, PageHeader, EmptyState, DataNote } from '../components/ui.jsx'
import { TOURNAMENT } from '../data/tournament.js'

export function AboutData() {
  return (
    <div className="container page">
      <Seo
        title="How we handle NPL data"
        description="NPL Fan Zone data sources, verification labels and our policy against fabricating cricket results or statistics."
      />
      <PageHeader
        eyebrow="Transparency"
        title="How we handle data"
        description="This is an independent fan project. Here is exactly where the cricket data comes from and how uncertain information is labelled."
      />

      <div className="container-narrow" style={{ paddingInline: 0 }}>
        <div className="stack">
          <section className="card card-pad">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>Tournament facts</h2>
            <p className="small">
              {TOURNAMENT.name} (Season {TOURNAMENT.season}) is scheduled from {TOURNAMENT.startDate} to{' '}
              {TOURNAMENT.endDate} at {TOURNAMENT.venue}, with {TOURNAMENT.teamCount} teams and{' '}
              {TOURNAMENT.matchCount} matches. The schedule was last checked on {TOURNAMENT.lastVerified}. As of that date,
              Season 3 had not started; historical record tables cover completed seasons through 2025. Source:{' '}
              <a href={TOURNAMENT.source.url} target="_blank" rel="noreferrer noopener" className="text-link">
                {TOURNAMENT.source.label}
              </a>
              .
            </p>
          </section>

          <section className="card card-pad">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>Verification labels</h2>
            <ul className="stack" style={{ gap: '0.7rem' }}>
              <li className="row" style={{ alignItems: 'flex-start' }}>
                <span className="badge badge-green">Verified</span>
                <span className="small">
                  Cross-checked against at least one published source and, where possible, a second.
                </span>
              </li>
              <li className="row" style={{ alignItems: 'flex-start' }}>
                <span className="badge badge-warn">Unverified</span>
                <span className="small">
                  Appears in a published list but could not be confirmed elsewhere. Kept visible so the
                  squad is complete, but clearly flagged.
                </span>
              </li>
              <li className="row" style={{ alignItems: 'flex-start' }}>
                <span className="badge badge-muted">Missing</span>
                <span className="small">
                  Left blank. We do not guess jersey numbers, birth dates, roles or career statistics.
                </span>
              </li>
            </ul>
          </section>

          <section className="card card-pad">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>Results, stats and live scores</h2>
            <p className="small">
              No match result, score or player statistic is invented. Every match begins as{' '}
              <em>upcoming</em>. Results appear only when an administrator enters a verified scorecard, and
              the points table and leaderboards are calculated from that data. Net run rate is derived from
              innings totals and overs, including the all-out rule.
            </p>
            <p className="small" style={{ marginTop: '0.7rem' }}>
              There is no official live-score feed connected to this build. If you see a score marked live,
              an administrator entered it manually. A live API can be added later through a server-side
              integration; the admin workflow remains the fallback.
            </p>
          </section>

          <DataNote variant="gold">
            <span className="small">
              Squads change. Always confirm team news with the official NPL or Cricket Association of Nepal
              channels before travelling to a match. Corrections can be submitted to whoever operates this
              deployment.
            </span>
          </DataNote>
        </div>
      </div>
    </div>
  )
}

export function Privacy() {
  return (
    <div className="container page">
      <Seo title="Privacy" description="What NPL Fan Zone stores and how to delete your data." noIndex />
      <PageHeader eyebrow="Privacy" title="Your data, plainly explained" />
      <div className="container-narrow" style={{ paddingInline: 0 }}>
        <div className="stack">
          <section className="card card-pad">
            <h3>What we store</h3>
            <p className="small">
              This prototype stores tournament content, match data, article text, the administrator session
              and uploaded article images in this browser. It does not provide fan accounts, profiles,
              predictions, polls or votes.
            </p>
          </section>
          <section className="card card-pad">
            <h3>What is public</h3>
            <p className="small">
              The sample team, match and article content shipped with the site is visible to every visitor.
              Changes made in this prototype, including published articles, are stored in the current browser
              only and are not shared with other visitors. Drafts also remain in this browser until published.
            </p>
          </section>
          <section className="card card-pad">
            <h3>Cookies and local storage</h3>
            <p className="small">
              Browser storage keeps the single-admin session, edited content and uploaded images. No
              advertising or third-party tracking scripts are included.
            </p>
          </section>
          <section className="card card-pad">
            <h3>Deleting your data</h3>
            <p className="small">
              Use the admin dashboard's reset tool to restore sample content, or clear this site's storage in
              your browser settings to remove all local content and the admin session.
            </p>
          </section>
          <div className="row">
            <ShieldCheck size={18} aria-hidden="true" />
            <span className="small muted">
              This page is a plain-language summary, not legal advice. Add your own policy before a public
              launch.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="container page">
      <Seo title="Page not found" noIndex />
      <EmptyState title="That page does not exist" icon={FileWarning}>
        The link may be old, or the page may have been removed.
        <div className="row" style={{ justifyContent: 'center', marginTop: '0.8rem' }}>
          <Link to="/" className="btn btn-primary btn-sm">
            Go to the homepage
          </Link>
          <Link to="/fixtures" className="btn btn-outline btn-sm">
            View fixtures
          </Link>
        </div>
      </EmptyState>
    </div>
  )
}

