import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import NotFoundPage from '@/pages/NotFoundPage'
import RouteErrorPage from '@/pages/RouteErrorPage'
import { adminRoutes } from '@/routes/adminRoutes'
import { publicRoutes } from '@/routes/publicRoutes'

/**
 * The single route table.
 *
 * Pages are referenced through small modules in `src/routes`, so adding a page means
 * editing one file rather than hunting through the router. Pages are declared with `lazy`
 * so each becomes its own chunk instead of shipping as one large bundle.
 *
 * The catch-all route renders NotFoundPage for any unmatched URL. It sits last, after the
 * public and admin trees.
 */
const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    errorElement: <RouteErrorPage />,
    children: [...publicRoutes, ...adminRoutes, { path: '*', Component: NotFoundPage }],
  },
])

export { router }
