import { imageUrl } from '@/services/mediaUrls'
import { cn } from '@/lib/utils'

/**
 * Avatar image with a lettered fallback.
 *
 * The profile may not have an avatar uploaded yet, so the fallback keeps the layout stable
 * and the identity clear. It carries `aria-label` rather than `alt`, because a `div` is
 * announced as its accessible name where an `img` would be announced as its `alt` text.
 */
export function Avatar({
  path,
  fullName,
  className,
}: {
  path: string | null | undefined
  fullName: string | null | undefined
  className?: string
}) {
  const url = imageUrl(path)

  if (url) {
    return <img src={url} alt={fullName ? `${fullName}'s avatar` : 'Avatar'} className={className} />
  }

  // First letters of the first two words, so "Mahmoud Dahy" reads as "MD".
  const initials = (fullName ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div
      aria-label={fullName ? `${fullName}'s avatar` : 'Avatar'}
      className={cn('bg-primary/10 text-primary flex items-center justify-center font-medium', className)}
    >
      {initials || '?'}
    </div>
  )
}
