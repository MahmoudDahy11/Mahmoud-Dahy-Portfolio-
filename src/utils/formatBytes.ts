const UNITS = ['B', 'KB', 'MB', 'GB'] as const

/** Formats a byte count for display, e.g. 1536 becomes "1.5 KB". */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return ''
  if (bytes <= 0) return '0 B'

  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10

  return `${rounded} ${UNITS[unitIndex]}`
}
