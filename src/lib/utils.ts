import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names, letting later Tailwind utilities win over earlier conflicting
 * ones. `cn('p-2', 'p-4')` produces `'p-4'` instead of both classes competing.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
