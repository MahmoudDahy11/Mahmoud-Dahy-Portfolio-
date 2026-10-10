/**
 * A failure that has already been turned into something a user can read.
 *
 * Services catch Supabase errors and throw this instead, so components never have to
 * interpret a raw PostgREST error object. The original is kept in `cause` for the
 * console, and must never be shown to a visitor as-is.
 */
export class AppError extends Error {
  // `Error.cause` already exists on the base class, so overriding it needs the keyword.
  // It is declared explicitly to keep the field visible in editors.
  override readonly cause: unknown

  constructor(message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'AppError'
  }
}

/** Narrows an unknown catch value to a displayable message. */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof AppError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}
