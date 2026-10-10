import { useSeo } from '@/hooks/useSeo'
import { Container } from '@/components/common/Section'
import { Button } from '@/components/ui/button'
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'

/**
 * Rendered by react-router when a loader/action throws.
 *
 * Separates between a 404 (which the NotFoundPage handles via the catch-all route) and
 * an unexpected error. The stack trace is never shown; the user gets a plain message and
 * a way to retry by reloading the current location.
 */
export default function RouteErrorPage() {
  useSeo({ title: 'Something went wrong — Portfolio', description: 'An unexpected error occurred.', noIndex: true })

  const error = useRouteError()
  const navigate = useNavigate()

  let message = 'An unexpected error occurred.'
  let status: number | undefined

  if (isRouteErrorResponse(error)) {
    status = error.status
    if (error.status === 404) {
      message = 'The page could not be found.'
    } else if (typeof error.data === 'string') {
      message = error.data
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <div className="space-y-2">
          {status ? <p className="text-primary text-sm font-medium">{status}</p> : null}
          <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">{message}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload page
          </Button>
          <Button onClick={() => navigate('/')} variant="ghost">
            Go home
          </Button>
        </div>
      </div>
    </Container>
  )
}
