/**
 * Formats an ISO date string for display.
 *
 * Returns an empty string rather than "Invalid Date" when the input is missing or
 * malformed, so a partially filled record renders a blank field instead of an error.
 */
export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-GB', options ?? { year: 'numeric', month: 'short' }).format(date)
}

/** Formats a date range, collapsing the end side when it is absent or ongoing. */
export function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  const from = formatDate(start)
  const to = formatDate(end)

  if (from && to) return `${from} — ${to}`
  if (from) return from
  return ''
}
