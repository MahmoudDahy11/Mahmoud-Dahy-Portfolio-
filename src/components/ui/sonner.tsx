import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useThemeContext } from '@/providers/ThemeProvider'

/**
 * Toast host for the whole application.
 *
 * Uses the project's own ThemeProvider rather than a separate theme library, so toasts
 * follow the same light/dark state as the rest of the UI. Colours are read from the
 * design tokens, which means they stay correct in both themes automatically.
 */
function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useThemeContext()

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      position="bottom-right"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
