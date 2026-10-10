import { Controller, useFormContext } from 'react-hook-form'
import { FieldShell, errorMessage } from '@/components/common/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type NumberFieldProps = {
  name: string
  label: string
  description?: string
  required?: boolean
  min?: number
  max?: number
  className?: string
}

/**
 * Whole-number input connected to React Hook Form.
 *
 * Separate from `TextField` because of one detail that matters: a number input's value is
 * a string until something converts it, and `Number('')` is `0`. So a blank field would
 * silently save as zero — a sort order of 0, a proficiency of 0% — instead of meaning "not
 * set". `setValueAs` produces `undefined` for a blank field, which the service stores as
 * `NULL`, and the schema's `z.number()` then rejects anything genuinely non-numeric.
 */
export function NumberField({ name, label, description, required, min, max, className }: NumberFieldProps) {
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
          type="number"
          inputMode="numeric"
          aria-describedby={describedBy}
          aria-invalid={invalid}
          min={min}
          max={max}
          {...register(name, {
            // A cleared number input yields `null` rather than `undefined`. That allows the
            // schema to distinguish "cleared" (an explicit null that reaches the database
            // and clears the column) from "never sent" (dropped, leaving the column alone).
            setValueAs: (value: string) => (value === '' ? null : Number(value)),
          })}
        />
      )}
    </FieldShell>
  )
}

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  name: string
  label: string
  description?: string
  options: SelectOption[]
  /** Shown when nothing is chosen. Doubles as the "no value" option's meaning. */
  placeholder?: string
  required?: boolean
  className?: string
}

/**
 * Dropdown connected to React Hook Form.
 *
 * The form stores a string, including `''` for "not chosen", while the underlying control
 * uses `null` for that state. The conversion happens here rather than in each form, which
 * is what lets a `<select>` stand in for a nullable foreign key without the service layer
 * needing to know which controls exist.
 *
 * The trigger is a button, so the label is attached with `aria-labelledby` rather than
 * `htmlFor` — otherwise the dropdown would have no accessible name.
 */
export function SelectField({
  name,
  label,
  description,
  options,
  placeholder = 'Not set',
  required,
  className,
}: SelectFieldProps) {
  const { control, formState } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FieldShell
          label={label}
          description={description}
          required={required}
          error={errorMessage(formState.errors[name])}
          className={className}
        >
          {({ id, labelId, describedBy }) => (
            <Select
              value={(field.value as string) || null}
              onValueChange={(value) => field.onChange(value ?? '')}
            >
              <SelectTrigger
                id={id}
                className="w-full"
                aria-labelledby={labelId}
                aria-describedby={describedBy}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>

              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldShell>
      )}
    />
  )
}
