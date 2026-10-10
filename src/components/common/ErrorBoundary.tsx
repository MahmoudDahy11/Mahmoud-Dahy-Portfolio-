import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * Catches render errors so one broken component cannot leave the whole site blank.
 *
 * A React render error unmounts the entire tree by default. This boundary keeps the
 * shell visible and shows a recoverable message instead.
 *
 * The technical detail stays in `componentDidCatch` for the console. What the visitor
 * sees is deliberately plain, and contains no internal information.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled rendering error:', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ error: null })
  }

  override render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">
          The page could not be displayed. Reloading the page usually fixes it.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
