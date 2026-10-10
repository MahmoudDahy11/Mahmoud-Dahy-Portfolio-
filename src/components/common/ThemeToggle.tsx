import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Theme } from '@/providers/ThemeProvider'
import { useThemeContext } from '@/providers/ThemeProvider'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/**
 * Light / dark / system switcher.
 *
 * The icon shows the theme currently in effect, so a visitor on "system" sees what they
 * are actually looking at rather than the literal word "system".
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useThemeContext()
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Change colour theme">
            <ActiveIcon aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            aria-current={theme === value ? 'true' : undefined}
            className={theme === value ? 'bg-muted font-medium' : undefined}
          >
            <Icon aria-hidden="true" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
