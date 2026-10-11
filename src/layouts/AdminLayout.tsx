import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Logo, ThemeToggle } from '@/components/common/Navigation'
import { ADMIN_NAV } from '@/constants/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { SignOutButton } from '@/features/auth/SignOutButton'
import { useNoIndex } from '@/hooks/useSeo'

/**
 * Sidebar link rows.
 *
 * Rendered as a shared function because the same list appears twice: in the persistent
 * desktop sidebar and inside the mobile drawer. Duplicating the styling would let the
 * two drift apart.
 */
function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-6 px-3 py-4">
      {ADMIN_NAV.map((group) => (
        <div key={group.label}>
          <p className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    ].join(' ')
                  }
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/**
 * Chrome for the admin dashboard: sidebar, header, content area.
 *
 * The sidebar is fixed on desktop and a drawer on small screens, so the dashboard is
 * usable on a phone without a separate mobile design.
 */
export function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // The dashboard is private by design; say so to crawlers directly, not just in robots.txt.
  useNoIndex()

  return (
    <div className="editorial bg-muted/40 flex min-h-screen">
      <a
        href="#admin-content"
        className="bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="bg-background hidden w-64 shrink-0 border-r lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <SidebarLinks />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open admin navigation"
                  >
                    <Menu aria-hidden="true" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                <div className="flex h-16 items-center justify-between border-b px-6">
                  <Logo />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Close navigation"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-4rem)]">
                  <SidebarLinks onNavigate={() => setMobileNavOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium lg:hidden">Admin</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/*
              `target="_blank"` with `rel="noopener noreferrer"` is required for any
              external link opened in a new tab. Without `noopener` the opened page can
              reach back into this one through `window.opener`.
            */}
            <Button variant="outline" size="sm" nativeButton={false} render={
              <a href="/" target="_blank" rel="noopener noreferrer" />
            }>
              View site
              <ExternalLink aria-hidden="true" />
            </Button>
            <SignOutButton />
          </div>
        </header>

        <main id="admin-content" tabIndex={-1} className="flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
