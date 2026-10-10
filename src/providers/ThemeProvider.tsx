import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Must match the key used by the pre-paint script in index.html. */
const STORAGE_KEY = 'portfolio-theme'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // localStorage can be unavailable in private browsing. Falling back to 'system'
    // keeps the site working instead of failing.
  }
  return 'system'
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Manages the light/dark/system theme.
 *
 * The class is toggled on <html> because that is where the CSS custom properties are
 * defined, and an inline script in index.html has already applied the correct class
 * before first paint. This provider keeps it in sync afterwards rather than being
 * responsible for the initial render.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === 'system' ? systemTheme() : theme,
  )

  useEffect(() => {
    const resolved = theme === 'system' ? systemTheme() : theme
    setResolvedTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persisting the preference is a convenience, not a requirement.
    }
  }, [theme])

  // Follow the OS setting while the user has chosen "system".
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const resolved = systemTheme()
      setResolvedTheme(resolved)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useThemeContext(): ThemeContextValue {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used inside <ThemeProvider>.')
  }
  return context
}
