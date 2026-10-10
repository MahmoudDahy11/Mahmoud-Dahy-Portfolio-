import { AppError } from '@/lib/errors'
import { getSupabaseClient } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database'
import type { Create, Row, TableNames, Update } from '@/types/entities'

/**
 * Shared plumbing for every service.
 *
 * A service is the only layer allowed to talk to Supabase. Beyond running the query, its
 * job is to hand the rest of the app something predictable: a value on success, or an
 * `AppError` carrying a message a person can read.
 *
 * PostgREST does not throw by default. A permission error arrives as a *successful*
 * response with `error` set and `data` null, so every call must check `error` — and
 * forgetting to is the easiest way to silently render a broken page. `runQuery`
 * centralises that check so no individual service has to remember it.
 */

/** The shape every Supabase call resolves to. */
type SupabaseResult = { error: { message: string } | null; data: unknown }

/**
 * A Supabase query.
 *
 * Typed as `PromiseLike` rather than `Promise` because PostgREST returns a builder that is
 * awaitable but is not a `Promise` — it has no `catch` or `finally`. Requiring `Promise`
 * would force every service to wrap its query in an async arrow for no benefit, so
 * `PromiseLike` is what actually describes what Supabase hands back.
 */
type SupabaseQuery = PromiseLike<SupabaseResult>

/** Fallback used when Supabase reports a failure without a usable message. */
const GENERIC_FAILURE = 'Could not load this content.'

/**
 * Runs a Supabase call and returns its data, or throws a readable `AppError`.
 *
 * The original error is kept on `cause` so the console retains the detail (status code,
 * PostgREST hint, SQLSTATE) while the UI only ever shows the readable message.
 */
export async function runQuery<T>(
  operation: () => SupabaseQuery,
  failureMessage: string = GENERIC_FAILURE,
): Promise<T> {
  const { data, error } = await operation()

  if (error) {
    console.error(`[supabase] ${failureMessage}`, error)
    throw new AppError(error.message || failureMessage, error)
  }

  return data as T
}

/** Runs a write and returns the affected rows. */
export async function runMutation<T>(
  operation: () => SupabaseQuery,
  failureMessage: string,
): Promise<T> {
  return runQuery<T>(operation, failureMessage)
}

/**
 * A key is renamed only when it looks like a database column: lower-case words joined by
 * single underscores. Anything else — an id, a camelCase key, a key from a JSON payload —
 * is left exactly as it is, so the rename can never corrupt data it does not own.
 */
const SNAKE_CASE_KEY = /^[a-z0-9]+(_[a-z0-9]+)+$/

/** `cover_image_path` -> `coverImagePath`. */
function toCamelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase())
}

/**
 * Converts a database row's keys from `snake_case` to `camelCase`.
 *
 * It recurses, so an embedded relation such as
 * `project_technologies: [{ technology: { cover_image_path } }]` arrives already renamed and
 * usable without a second rename step. Renaming nested keys is required for that: PostgREST
 * names a relation after its table, so `skill_categories` has to become `skillCategories`
 * at every level.
 *
 * The consequence is that a `jsonb` column's *own* keys would also be renamed. No table in
 * this schema stores arbitrary JSON, so there is nothing today for that to affect; if a
 * column like that is ever added, the transform must skip its value rather than the whole
 * app be rewritten.
 *
 * Why this cannot drift silently from the schema: the return type is the app-facing
 * `Row<TableName>`, and that type is itself *derived* from the generated database types. If
 * a column is renamed or removed and the types are regenerated, the compiler reports it at
 * every place that used the field. The runtime transform and the compile-time type describe
 * the same rule, so they cannot disagree.
 */
function camelize<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelize(item)) as T
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}

    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[SNAKE_CASE_KEY.test(key) ? toCamelCase(key) : key] = camelize(nested)
    }

    return result as T
  }

  return value as T
}

/** Converts one database row into the app-facing camelCase shape. */
export function toEntity<TableName extends TableNames>(row: Row<TableName>): Row<TableName> {
  return camelize<Row<TableName>>(row)
}

/** Converts a list of database rows. */
export function toEntities<TableName extends TableNames>(
  rows: Row<TableName>[],
): Row<TableName>[] {
  return rows.map((row) => toEntity(row))
}

/**
 * Runs a read and converts the rows in one step.
 *
 * Every read in this project goes through here, so `error` handling and the key rename
 * cannot be forgotten on an individual call.
 */
export async function fetchRows<TableName extends TableNames>(
  operation: () => SupabaseQuery,
  failureMessage: string,
): Promise<Row<TableName>[]> {
  const rows = await runQuery<Row<TableName>[]>(operation, failureMessage)
  return toEntities(rows)
}

/**
 * The first row of a read, converted, or `null` when there is none.
 *
 * Exists for the single-row tables. Calling `runQuery` directly and taking `rows[0]` is the
 * obvious way to write this, and it silently returns `snake_case` keys — the type says
 * camelCase, so TypeScript accepts it and the value is `undefined` at runtime. That bug was
 * live in `getProfile` and `getSiteSettings` and was caught only by the live API tests, not
 * by the compiler. One function for the shape removes the opportunity to get it wrong.
 */
export async function fetchFirst<TableName extends TableNames>(
  operation: () => SupabaseQuery,
  failureMessage: string,
): Promise<Row<TableName> | null> {
  const rows = await fetchRows<TableName>(operation, failureMessage)
  return rows[0] ?? null
}

/**
 * Runs a read that embeds relations, and converts the rows.
 *
 * `fetchRows` returns the table's own row type, which is correct for `select('*')` but wrong
 * for a select that joins: the embedded keys are genuinely in the result, and hiding them
 * from the type leaves the service casting `as unknown as` to get them back — which is
 * exactly the mistake the generated types exist to prevent.
 *
 * The joined shape is therefore stated by the caller as a local type beside its select
 * string. That is one extra type to keep in step with the query, in exchange for the error
 * check, the key rename, and the relation shape all being settled in one place.
 */
export async function fetchJoined<T>(
  operation: () => SupabaseQuery,
  failureMessage: string,
): Promise<T[]> {
  return camelize<T[]>(await runQuery<unknown[]>(operation, failureMessage))
}

/**
 * The row an insert or update produced, converted, or `null` when none came back.
 *
 * Mutations need the same conversion as reads, and return the same shape, so the
 * alternative — `runMutation` plus a manual rename — has the identical failure mode.
 */
export async function fetchOne<TableName extends TableNames>(
  operation: () => SupabaseQuery,
  failureMessage: string,
): Promise<Row<TableName> | null> {
  return fetchFirst<TableName>(operation, failureMessage)
}

/**
 * A write that must affect exactly one row, or fail.
 *
 * PostgREST reports "the statement ran but matched nothing" as a *success* with no rows,
 * which happens whenever an update targets an id that is not there. Ignoring that returns
 * `null` straight into a success toast, so the owner is told a change was saved when
 * nothing was written. This is the one place that turns it into a visible error.
 */
export async function fetchOneOrThrow<TableName extends TableNames>(
  operation: () => SupabaseQuery,
  failureMessage: string,
): Promise<Row<TableName>> {
  const row = await fetchOne<TableName>(operation, failureMessage)

  if (!row) {
    throw new AppError(failureMessage)
  }

  return row
}

/** `coverImagePath` -> `cover_image_path`. */
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Converts a form's camelCase values into the snake_case keys Postgres expects.
 *
 * This is the exact inverse of `camelize`, and it exists for the same reason: the app
 * speaks camelCase everywhere, so a form should not have to know a column name in order to
 * save a record. Without it, every service would either hand-write snake_case payloads —
 * duplicating the rename the compiler already enforces for reads — or skip the conversion
 * and send `{ isPublished: true }`, which Postgres rejects with a column-not-found error.
 *
 * Only keys containing a capital letter are renamed, so an already-correct key is left
 * alone and a value can never be corrupted by the transform.
 *
 * The cast is safe for the same reason `camelize`'s is: the parameter type is the app
 * shape and the return type is the generated insert type, and the two are derived from the
 * same table definition, so a column that does not exist cannot be expressed in either.
 */
function decamelize<TableName extends TableNames>(
  values: Create<TableName> | Update<TableName>,
): TablesInsert<TableName> {
  const rename = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rename)

    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {}

      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        // A key the caller left `undefined` is dropped here rather than written as an
        // `undefined` value. That is what makes a partial update work: the column is absent
        // from the payload, so Postgres leaves it alone, instead of being sent as an empty
        // value and clearing data the form never touched. Omitting it at the source also
        // keeps the behaviour from depending on how the Supabase client serialises a body.
        if (nested === undefined) continue

        result[/[A-Z]/.test(key) ? toSnakeCase(key) : key] = rename(nested)
      }

      return result
    }

    // An empty or whitespace-only text input means "no value", and the schema allows NULL
    // for every optional column. Storing the blank string instead would satisfy a length
    // check while making the row render an empty heading on the public site, and would break
    // a NOT NULL column with a less obvious message. Required fields cannot reach this:
    // their schema rejects a blank value before the form is submitted.
    //
    // Whitespace is treated the same as empty because not every schema trims. `optionalText`
    // does, but the URL and date rules deliberately do not — a date is validated by shape
    // rather than parsed, and a URL keeps its original casing — so a field left holding only
    // spaces would otherwise be written to the row verbatim. Blank is blank in all of them.
    return typeof value === 'string' && value.trim() === '' ? null : value
  }

  return rename(values) as TablesInsert<TableName>
}

/** Values sent to an `insert`, converted to column names. */
export type Insert<TableName extends TableNames> = Create<TableName>

/** Update payload. Every column is optional. */
export type Patch<TableName extends TableNames> = Update<TableName>

/** The table a service operates on. */
export type Table = TableNames

/**
 * Prepares a form's values for a write.
 *
 * Every insert and update in the project goes through this, so a service never builds a
 * snake_case object by hand and the rename cannot be forgotten on one call. It also
 * applies the empty-string rule described above.
 *
 * A key whose value is `undefined` is dropped, which is what makes a partial update work:
 * only the fields the form actually holds are sent, so a column the form did not touch is
 * left as it is instead of being cleared.
 *
 * The table name is passed explicitly (`toDatabaseRow<'skills'>(values)`) because it cannot
 * be inferred from the value's type, and inferring it would widen the result to a union of
 * every table in the database.
 */
export function toDatabaseRow<TableName extends TableNames>(
  values: Create<TableName> | Update<TableName>,
): TablesInsert<TableName> {
  return decamelize(values)
}

/** Re-exported so services do not need to know the client is a singleton. */
export { getSupabaseClient }
