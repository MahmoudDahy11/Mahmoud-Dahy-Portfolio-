import { useEffect, useState } from 'react'

/**
 * Returns a value that only updates after `delay` milliseconds of quiet.
 *
 * Used by search inputs so typing does not fire a database request on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
