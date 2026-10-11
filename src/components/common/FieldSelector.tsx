import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FIELD_FILTER_LABELS,
  FIELD_FILTER_OPTIONS,
  FIELD_OPTIONS,
  type FieldFilter,
  type FieldOption,
} from '@/constants/fields'

type FieldSelectorBaseProps = {
  /**
   * Accessible name for the group. It should describe what choosing a field does, because
   * the visible text is only the field names themselves: "Filter skills by field",
   * "Select the skills field to view".
   */
  ariaLabel: string
  className?: string
  /**
   * The options to offer, in order. Defaults to every field, or every field plus "All" when
   * `includeAll` is set. Pass a narrower list to hide a field that has no content yet.
   */
  options?: readonly FieldFilter[]
}

type SingleFieldProps = FieldSelectorBaseProps & {
  value: FieldOption
  onChange: (value: FieldOption) => void
  includeAll?: false
}

type AnyFieldProps = FieldSelectorBaseProps & {
  value: FieldFilter
  onChange: (value: FieldFilter) => void
  includeAll: true
}

/**
 * A Software / ELV segmented control.
 *
 * Shared by the public About skills section and the admin skill and category filters so the
 * choice looks and behaves the same everywhere. A `Button` group with `aria-pressed` is the
 * same pattern the public projects filter uses.
 *
 * With `includeAll` the selector gains an "All" option, which the public section uses to show
 * every field at once. The overloads keep that option out of the admin tables, which always
 * show exactly one field.
 */
export function FieldSelector(props: SingleFieldProps): ReactElement
export function FieldSelector(props: AnyFieldProps): ReactElement
export function FieldSelector({
  value,
  onChange,
  includeAll = false,
  options,
  ariaLabel,
  className,
}: SingleFieldProps | AnyFieldProps) {
  const list = options ?? (includeAll ? FIELD_FILTER_OPTIONS : FIELD_OPTIONS)
  const change = onChange as (value: FieldFilter) => void

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label={ariaLabel}>
      {list.map((option) => {
        const isActive = option === value

        return (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            aria-pressed={isActive}
            onClick={() => change(option)}
          >
            {FIELD_FILTER_LABELS[option]}
          </Button>
        )
      })}
    </div>
  )
}
