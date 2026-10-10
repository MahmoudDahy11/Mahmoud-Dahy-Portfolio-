import { Pencil, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type RowActionsProps = {
  /** Name of the record, used in the button labels for screen-reader users. */
  recordName: string
  onEdit: () => void
  onDelete: () => void
  isPending?: boolean
  /**
   * Verb for the primary action, for rows where opening is not editing.
   *
   * The contact inbox is the case this exists for: a message is read-only, so a pencil and
   * the word "Edit" would promise a form that does not exist.
   */
  editLabel?: string
  /** Overrides the primary action's icon, to match `editLabel`. */
  editIcon?: LucideIcon
}

/**
 * The edit and delete buttons in a table row.
 *
 * Every admin table has this pair in its last column, in the same place, with the same
 * destructive styling. The accessible names include the record's name rather than just
 * "Edit", because a screen-reader user moving through a table otherwise hears a column of
 * identical buttons with nothing to tell them apart.
 */
export function RowActions({
  recordName,
  onEdit,
  onDelete,
  isPending = false,
  editLabel = 'Edit',
  editIcon: EditIcon = Pencil,
}: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        disabled={isPending}
        aria-label={`${editLabel} ${recordName}`}
      >
        <EditIcon aria-hidden="true" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        disabled={isPending}
        aria-label={`Delete ${recordName}`}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
}
