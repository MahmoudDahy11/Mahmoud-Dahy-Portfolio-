import { useThemeContext } from '@/providers/ThemeProvider'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { PUBLIC_NAV } from '@/constants/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

/**
 * Site logo and name.
 *
 * Rendered as a link home from every layout, including the dashboard header, so the way
 * back to the public site is always one click away and always in the same position.
 *
 * The name comes from `site_settings` so the owner can change it without a code change.
 * `AdminLayout` passes nothing and gets the default.
 */
export function Logo({ name = 'Portfolio' }: { name?: string }) {
  return (
    <Link
      to="/"
      className="text-base font-semibold tracking-tight transition-opacity hover:opacity-80"
    >
      {name}
    </Link>
  )
}

function navLinkClass(isActive: boolean) {
  return [
    'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'text-foreground after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:content-[""]'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
  ].join(' ')
}

/** Desktop navigation. Hidden below the medium breakpoint, where the drawer is used. */
export function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden md:flex md:items-center md:gap-1">
      {PUBLIC_NAV.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Mobile navigation drawer. Closes on navigate so the new page is visible. */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
            <Menu aria-hidden="true" />
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetTitle className="mb-4 text-left">Navigation</SheetTitle>
        <nav aria-label="Mobile" className="flex flex-col gap-1" onClick={() => setOpen(false)}>
          {PUBLIC_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

/** Theme switcher, exported so layouts can place it without importing the provider. */
export { ThemeToggle }

/** Convenience re-export to keep layout imports to a single line. */
export function useResolvedTheme() {
  return useThemeContext().resolvedTheme
}
