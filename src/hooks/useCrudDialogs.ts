import { useState } from 'react'

/**
 * Open/close state for one section's create, edit, and delete dialogs.
 *
 * Every admin section needs the same three pieces of state, and keeping them in one hook
 * means a page holds no `useState` calls at all — it declares what it is editing and the
 * shared pieces do the rest. That is what stops the thirteen sections from drifting into
 * slightly different behaviour, such as a delete dialog that survives a successful delete.
 *
 * `editing` and `deleting` hold the row rather than just a flag, so the dialog knows which
 * record it is acting on without a second lookup.
 */
export function useCrudDialogs<TRow>() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editing, setEditing] = useState<TRow | null>(null)
  const [deleting, setDeleting] = useState<TRow | null>(null)

  return {
    isCreateOpen,
    editing,
    deleting,

    /**
     * Exactly one dialog is ever open. Opening one clears the others, so a stale
     * confirmation dialog cannot appear behind a form.
     */
    openCreate: () => {
      setEditing(null)
      setDeleting(null)
      setIsCreateOpen(true)
    },
    openEdit: (row: TRow) => {
      setIsCreateOpen(false)
      setDeleting(null)
      setEditing(row)
    },
    openDelete: (row: TRow) => {
      setIsCreateOpen(false)
      setEditing(null)
      setDeleting(row)
    },

    closeCreate: () => setIsCreateOpen(false),
    closeEdit: () => setEditing(null),
    closeDelete: () => setDeleting(null),
  }
}
