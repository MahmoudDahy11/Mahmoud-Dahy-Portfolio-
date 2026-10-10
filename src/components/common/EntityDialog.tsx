import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { DefaultValues, FieldValues, SubmitHandler } from 'react-hook-form'
import type { ZodType } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type EntityDialogProps<TValues extends FieldValues> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /**
   * The section's Zod schema. Its inferred type is the form's type, so the shape of the
   * form and the rules that validate it are one definition. Only the schema's *output* is
   * pinned to `TValues`: a field that accepts an empty string and transforms it (to clear
   * a column) makes the input shape differ from the output, and `zodResolver` only needs
   * the output to match.
   */
  schema: ZodType<TValues, any>
  /**
   * Values the form starts with. For an edit dialog this is built from the stored row, so
   * the form shows what is saved rather than what the schema defaults to.
   */
  defaultValues: DefaultValues<TValues>
  onSubmit: SubmitHandler<TValues>
  submitLabel?: string
  /**
   * Extra pending state owned by the caller, such as an image upload that must finish
   * before the record is saved. Disables the submit button so a half-finished upload is
   * never persisted.
   */
  isBusy?: boolean
  /** Widens the dialog for forms that need a two-column grid. */
  size?: 'default' | 'lg'
  children: ReactNode
}

/**
 * The one dialog every admin create and edit form is rendered inside.
 *
 * Centralising it is what makes the admin sections behave identically. Here, and nowhere
 * per entity, it is decided that:
 *
 * - a failed save leaves the dialog open with the entered values intact, so nothing the
 *   owner typed is lost;
 * - the submit button is disabled while the request runs, which is what stops a double
 *   click creating two records;
 * - the form is reset to `defaultValues` each time the dialog opens, so editing project B
 *   straight after project A never shows A's values;
 * - a save that validation rejects scrolls to and focuses the field that failed, because
 *   the form body scrolls on its own and an error outside the visible part reads as a
 *   button that does nothing;
 * - children read form state through `useFormContext()`, which is how `TextField` and its
 *   siblings are shared by every form without any of them knowing which form it is in.
 */
export function EntityDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  isBusy = false,
  size = 'default',
  children,
}: EntityDialogProps<TValues>) {
  const form = useForm<TValues, unknown, TValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic variance: the resolver's Zod4 overload
    // fixes Input to FieldValues, which cannot structurally match a generic TValues even though every
    // concrete call site satisfies it. The cast is safe because each caller passes a concrete z.object().
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  const formRef = useRef<HTMLFormElement>(null)

  // Bumped by a rejected validation so the field that failed can be brought into view
  // after React has painted the error. Doing it inside the handler is too early: the
  // errors exist but the DOM does not show them yet, so there would be nothing to focus.
  const [failedValidation, setFailedValidation] = useState(0)

  useEffect(() => {
    if (failedValidation === 0) return

    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    firstInvalid?.scrollIntoView({ block: 'center' })
    firstInvalid?.focus({ preventScroll: true })
  }, [failedValidation])


  // These dialogs stay mounted and are reused for every row in the table, so the form has
  // to be reset when it opens rather than on mount. The latest values are held in a ref
  // because the caller passes a fresh object on each render, and using it as an effect
  // dependency would wipe the form while the owner is typing.
  const latestDefaults = useRef(defaultValues)
  latestDefaults.current = defaultValues

  useEffect(() => {
    if (open) {
      form.reset(latestDefaults.current)
    }
  }, [open, form])

  const isSubmitting = form.formState.isSubmitting || isBusy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={size === 'lg' ? 'sm:max-w-2xl' : undefined} showCloseButton={!isSubmitting}>
        <FormProvider {...form}>
          <form
            ref={formRef}
            noValidate
            onSubmit={form.handleSubmit(
              async (values) => {
                // The caller's handler closes the dialog itself, but only once the write has
                // succeeded. A rejection therefore leaves the form open for another attempt.
                await onSubmit(values)
              },
              // A rejected validation otherwise leaves the dialog open and perfectly still:
              // the field that failed may be scrolled out of view inside the form's own
              // scroll area, so the save looks like a button that does nothing.
              () => setFailedValidation((count) => count + 1),
            )}
          >
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>

            <div className="max-h-[min(70vh,40rem)] space-y-4 overflow-y-auto py-4">{children}</div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
