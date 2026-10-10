import { describe, expect, it } from 'vitest'
import { mediaUsageKey } from '@/services/mediaUsage'
import { referenceLabels } from '@/features/media/MediaAssetCard'
import { STORAGE_BUCKETS } from '@/constants/storage'

/**
 * The two pure pieces of the media usage work from Phase 6.
 *
 * `getMediaUsage` itself reads eleven tables and belongs in a live test; what can be
 * checked hermetically is the rule that decides *which* file a reference belongs to, and
 * the text the library shows for it. Both are small, and both being wrong would be
 * invisible: a key that ignored the bucket would let the résumé in `portfolio-files` be
 * matched against an image of the same path in `portfolio-media`.
 */
describe('mediaUsageKey', () => {
  it('keeps the same path in two buckets as two different files', () => {
    const media = mediaUsageKey(STORAGE_BUCKETS.media, 'misc/logo.png')
    const files = mediaUsageKey(STORAGE_BUCKETS.files, 'misc/logo.png')

    expect(media).not.toBe(files)
  })

  it('matches a reference to the asset it describes', () => {
    const key = mediaUsageKey(STORAGE_BUCKETS.media, 'profile/avatar-1234.png')

    // The shape the library looks up: a bucket and a path joined the same way both sides do.
    expect(key).toBe('portfolio-media::profile/avatar-1234.png')
  })
})

describe('referenceLabels', () => {
  it('joins every place a file is used', () => {
    const labels = [
      { label: 'Profile avatar', section: '/admin/profile' as const },
      { label: 'About: Story', section: '/admin/about' as const },
    ]

    expect(referenceLabels(labels)).toBe('Profile avatar, About: Story')
  })

  it('returns an empty string for a file nothing uses', () => {
    expect(referenceLabels([])).toBe('')
  })
})
