import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-50 flex items-center justify-center p-4">
          <div className="card p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-danger-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-danger-500" />
            </div>
            <h2 className="text-xl font-bold text-dark-900 mb-2">Une erreur est survenue</h2>
            <p className="text-sm text-dark-500 mb-6">
              L’application a rencontre un probleme inattendu. Vous pouvez reessayer ou recharger la page.
            </p>
            {this.state.error && (
              <details className="text-xs text-dark-400 text-left mb-4 bg-dark-50 rounded-lg p-3">
                <summary className="cursor-pointer">Details techniques</summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger la page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
