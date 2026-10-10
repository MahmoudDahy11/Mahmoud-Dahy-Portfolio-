import { Link, Outlet, ScrollRestoration } from 'react-router-dom'
import { Container } from '@/components/common/Section'
import { DesktopNav, Logo, MobileNav, ThemeToggle } from '@/components/common/Navigation'
import { SiteFooter, useSiteSettings } from '@/features/settings'
import { SocialLinks } from '@/features/socialLinks'
import { PUBLIC_ROUTES } from '@/constants/routes'

/**
 * Chrome for every public page: header, main region, footer.
 *
 * Page components render content only, which is what keeps spacing and navigation
 * identical across the site.
 */
export function PublicLayout() {
  const settings = useSiteSettings()

  // Falls back to "Portfolio" when the row has not been created yet, so the header is
  // never blank while loading.
  const siteName = settings.data?.siteTitle?.trim() || 'Portfolio'

  return (
    <div className="flex min-h-screen flex-col">
      {/*
        Skip link. Hidden until focused, which is how keyboard users bypass the
        navigation and reach the content directly.
      */}
      <a
        href="#main-content"
        className="bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2"
      >
        Skip to content
      </a>

      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Logo name={siteName} />
          <div className="flex items-center gap-2">
            <DesktopNav />
            <ThemeToggle />
            <MobileNav />
          </div>
        </Container>
      </header>

      {/*
        tabIndex -1 lets the skip link move focus here. Without it the link would move
        the scroll position but leave keyboard focus behind.
      */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      <footer className="border-t">
        <Container className="text-muted-foreground flex flex-col items-center justify-between gap-4 py-8 text-sm sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <SiteFooter />
            {/*
              `copyright_text` wins when the owner has written one, because it is a
              managed field and ignoring it would mean saving it in the admin dashboard
              had no effect. The generated line is the fallback for an unconfigured site.
            */}
            <p>{settings.data?.copyrightText?.trim() || `© ${new Date().getFullYear()} ${siteName}`}</p>
          </div>

          <div className="flex items-center gap-4">
            <SocialLinks variant="footer" />
            <Link to={PUBLIC_ROUTES.contact} className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </Container>
      </footer>

      {/* Restores scroll position on back/forward navigation. */}
      <ScrollRestoration />
    </div>
  )
}
