import { Badge } from '@/components/ui/badge'

/**
 * Published or draft, shown in an admin table.
 *
 * The word is the message, not the colour. A draft is invisible to visitors, so an admin
 * scanning a table of projects needs to know which rows are still work in progress —
 * colour alone would leave that unreadable for a colour-blind user and invisible to a
 * screen reader.
 */
export function PublishBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <Badge variant={isPublished ? 'default' : 'outline'}>
      <span aria-hidden="true">{isPublished ? '●' : '○'}</span>
      {isPublished ? 'Published' : 'Draft'}
    </Badge>
  )
}
