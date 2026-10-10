import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { DefaultValues, FieldValues, SubmitHandler } from 'react-hook-form'
import type { ZodType } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type EntityFormProps<TValues extends FieldValues> = {
  /** The form's Zod schema; its inferred output type is the form's type. */
  schema: ZodType<TValues, any>
  defaultValues: DefaultValues<TValues>
  onSubmit: SubmitHandler<TValues>
  title: string
  description?: string
  submitLabel?: string
  /** Extra pending state owned by the caller, such as an upload still running. */
  isBusy?: boolean
  /** Rendered under the title, before the fields. Used for warnings and hints. */
  notice?: ReactNode
  children: ReactNode
}

/**
 * The page-level counterpart to `EntityDialog`, for editing one existing record.
 *
 * The profile and the site settings are single rows: there is nothing to create, list, or
 * delete, so the dialog-and-table pattern would be two dialogs with one row each. This is
 * the same wiring in a page — same resolver, same context, same failed-save behaviour —
 * with the actions in a footer rather than a dialog bar.
 *
 * The submit button is disabled while the request runs, which is what prevents a double
 * click writing the same row twice.
 */
export function EntityForm<TValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  title,
  description,
  submitLabel = 'Save',
  isBusy = false,
  notice,
  children,
}: EntityFormProps<TValues>) {
  const form = useForm<TValues, unknown, TValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same generic variance workaround as EntityDialog
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  const isSubmitting = form.formState.isSubmitting || isBusy

  return (
    <Card>
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            // A rejection propagates and leaves the entered values in place, so a failed save
            // never costs the owner their typing.
            await onSubmit(values)
          })}
        >
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          </CardHeader>

          <CardContent className="space-y-6">
            {notice}
            {children}
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  )
}
