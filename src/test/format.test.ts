import { describe, expect, it } from 'vitest'
import { formatBytes } from '@/utils/formatBytes'
import { formatDate, formatDateRange } from '@/utils/formatDate'
import { toThemeOption } from '@/utils/toThemeOption'
import { toFieldOption } from '@/utils/toFieldOption'
import { toStorageBucket } from '@/utils/toStorageBucket'

describe('formatBytes', () => {
  it('formats small values as whole bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
  })

  it('keeps one decimal place below ten', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('drops the decimal once the value reaches ten', () => {
    expect(formatBytes(15 * 1024)).toBe('15 KB')
  })

  it('walks up through the units', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB')
  })

  it('returns an empty string for missing or invalid input', () => {
    expect(formatBytes(null)).toBe('')
    expect(formatBytes(undefined)).toBe('')
    expect(formatBytes(Number.NaN)).toBe('')
  })
})

describe('formatDate', () => {
  it('formats an ISO date', () => {
    expect(formatDate('2026-02-14')).toBe('Feb 2026')
  })

  it('returns an empty string rather than "Invalid Date"', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('not-a-date')).toBe('')
  })
})

describe('formatDateRange', () => {
  it('joins both ends when the role has ended', () => {
    expect(formatDateRange('2024-01-01', '2025-06-01')).toBe('Jan 2024 — Jun 2025')
  })

  it('shows only the start when the role is ongoing', () => {
    expect(formatDateRange('2024-01-01', null)).toBe('Jan 2024')
  })

  it('is empty when there is no start date', () => {
    expect(formatDateRange(null, '2025-06-01')).toBe('')
  })
})

describe('toThemeOption', () => {
  it('passes through each value the database check constraint allows', () => {
    expect(toThemeOption('light')).toBe('light')
    expect(toThemeOption('dark')).toBe('dark')
    expect(toThemeOption('system')).toBe('system')
  })

  it('falls back to system for a value it does not recognise', () => {
    // Unreachable while the constraint exists, but a column extended without updating the
    // app should degrade to a working page rather than an exception during render.
    expect(toThemeOption('sepia')).toBe('system')
    expect(toThemeOption(null)).toBe('system')
    expect(toThemeOption(undefined)).toBe('system')
  })
})

describe('toStorageBucket', () => {
  it('recognises the documents bucket', () => {
    expect(toStorageBucket('portfolio-files')).toBe('portfolio-files')
  })

  it('treats anything else as the media bucket', () => {
    expect(toStorageBucket('portfolio-media')).toBe('portfolio-media')
    expect(toStorageBucket('something-else')).toBe('portfolio-media')
    expect(toStorageBucket(null)).toBe('portfolio-media')
  })
})

describe('toFieldOption', () => {
  it('passes through each value the database check constraint allows', () => {
    expect(toFieldOption('software')).toBe('software')
    expect(toFieldOption('elv')).toBe('elv')
  })

  it('falls back to software for a value it does not recognise', () => {
    // Unreachable while the constraint exists, but a column extended without updating the
    // app should degrade to a working page rather than an exception during render.
    expect(toFieldOption('mechanical')).toBe('software')
    expect(toFieldOption(null)).toBe('software')
    expect(toFieldOption(undefined)).toBe('software')
  })
})
