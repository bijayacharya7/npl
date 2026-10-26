import { Component } from 'react'
import { Link } from 'react-router-dom'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[NPL Fan Zone] Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container page">
          <div className="error-state" role="alert">
            <h3>This page hit an unexpected error</h3>
            <p>
              This page could not render. You can reload it or head back to the homepage.
            </p>
            <div className="row">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
                Reload page
              </button>
              <Link to="/" className="btn btn-outline btn-sm">
                Go home
              </Link>
            </div>
            {import.meta.env.DEV && (
              <pre style={{ textAlign: 'left', overflowX: 'auto', fontSize: '0.72rem', marginTop: '1rem' }}>
                {String(this.state.error?.stack ?? this.state.error)}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
