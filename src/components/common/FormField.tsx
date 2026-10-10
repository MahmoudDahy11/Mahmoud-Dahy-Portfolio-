import type { ReactNode } from 'react'
import { useId } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type FieldShellProps = {
  label: string
  description?: string
  error?: string
  required?: boolean
  /**
   * Receives the ids the control must be wired to. `labelId` is separate from `id` because
   * a native input is associated with a `<label htmlFor>`, while a button-like control —
   * the select trigger — has to be pointed at the label with `aria-labelledby`.
   */
  children: (props: {
    id: string
    labelId: string
    describedBy: string | undefined
    invalid: boolean
  }) => ReactNode
  className?: string
}

/**
 * Label, control, help text, and error message wired together correctly.
 *
 * Every form in the project uses this, which is what guarantees the accessibility
 * requirements are met consistently: the label is programmatically associated with the
 * input, and any error or help text is referenced through `aria-describedby` so a screen
 * reader announces it when focus reaches the field.
 *
 * Errors are also linked with `aria-invalid` and shown in text, not colour alone.
 */
/**
 * Extracts a displayable string from a React Hook Form error entry.
 *
 * The type is a union because a field can carry nested errors for object or array
 * values. Only the flat case is handled here; nested fields render their own messages.
 */
export function errorMessage(fieldError: unknown): string | undefined {
  if (!fieldError || typeof fieldError !== 'object') return undefined
  const message = (fieldError as { message?: unknown }).message
  return typeof message === 'string' ? message : undefined
}

export function FieldShell({
  label,
  description,
  error,
  required,
  children,
  className,
}: FieldShellProps) {
  const id = useId()
  const labelId = `${id}-label`
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  // One id can reference both, which is why they are joined rather than chosen between.
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-2', className)}>
      <Label id={labelId} htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      {children({ id, labelId, describedBy, invalid: Boolean(error) })}

      {description ? (
        <p id={descriptionId} className="text-muted-foreground text-xs">
          {description}
        </p>
      ) : null}

      {/*
        `role="alert"` announces the message as soon as it appears, which is the point of
        showing it: a user who cannot see the red text still learns validation failed.
      */}
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = {
  name: string
  label: string
  description?: string
  placeholder?: string
  type?: 'text' | 'email' | 'url' | 'number' | 'password' | 'date' | 'tel'
  required?: boolean
  className?: string
  /**
   * Forwarded to the underlying input.
   *
   * Worth setting: it lets a browser autofill a known field and lets password managers
   * recognise the login form.
   */
  autoComplete?: string
  min?: number
  max?: number
  step?: number
}

/** Single-line text input connected to React Hook Form. */
export function TextField({
  name,
  label,
  description,
  placeholder,
  type = 'text',
  required,
  className,
  autoComplete,
  min,
  max,
  step,
}: TextFieldProps) {
  const { register, formState } = useFormContext()

  return (
    <FieldShell
      label={label}
      description={description}
      required={required}
      error={errorMessage(formState.errors[name])}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          {...register(name)}
        />
      )}
    </FieldShell>
  )
}

type TextAreaFieldProps = {
  name: string
  label: string
  description?: string
  placeholder?: string
  required?: boolean
  rows?: number
  className?: string
}

/** Multi-line text input connected to React Hook Form. */
export function TextAreaField({
  name,
  label,
  description,
  placeholder,
  required,
  rows = 4,
  className,
}: TextAreaFieldProps) {
  const { register, formState } = useFormContext()

  return (
    <FieldShell
      label={label}
      description={description}
      required={required}
      error={errorMessage(formState.errors[name])}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <Textarea
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          placeholder={placeholder}
          {...register(name)}
        />
      )}
    </FieldShell>
  )
}

type SwitchFieldProps = {
  name: string
  label: string
  description?: string
}

/**
 * Boolean toggle connected to React Hook Form.
 *
 * Uses `Controller` because a checkbox reports `checked`, not `value`, which the
 * uncontrolled `register` helper cannot handle.
 */
export function SwitchField({ name, label, description }: SwitchFieldProps) {
  const { control } = useFormContext()
  const id = useId()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor={id} className="cursor-pointer">
              {label}
            </Label>
            {description ? (
            <p id={`${id}-description`} className="text-muted-foreground text-xs">
              {description}
            </p>
          ) : null}
          </div>
          <input
            id={id}
            type="checkbox"
            checked={field.value ?? false}
            onChange={(event) => field.onChange(event.target.checked)}
            aria-describedby={description ? `${id}-description` : undefined}
            className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1 size-4 shrink-0 cursor-pointer rounded border"
          />
        </div>
      )}
    />
  )
}
