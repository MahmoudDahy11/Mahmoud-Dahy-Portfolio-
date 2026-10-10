import { useSeo } from '@/hooks/useSeo'
import { Container } from '@/components/common/Section'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ADMIN_ROUTES } from '@/constants/routes'

/**
 * Catch-all page for routes that do not exist.
 *
 * The message is specific and the button sends the visitor somewhere useful instead of
 * leaving them on a broken page.
 */
export default function NotFoundPage() {
  useSeo({ title: 'Page not found — Portfolio', description: 'This page does not exist.', noIndex: true })
  const navigate = useNavigate()

  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <div className="space-y-2">
          <p className="text-primary text-sm font-medium">404</p>
          <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground max-w-md">
            The page you are looking for might have been moved or no longer exists.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go back
          </Button>
          <Button onClick={() => navigate(ADMIN_ROUTES.dashboard)}>Go to dashboard</Button>
          <Button onClick={() => navigate('/')} variant="ghost">
            Go home
          </Button>
        </div>
      </div>
    </Container>
  )
}
