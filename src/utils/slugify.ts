/**
 * Turns a title into a URL slug.
 *
 * Projects are addressed by slug, so this must be deterministic and match the database's
 * slug rule: lowercase alphanumerics separated by single hyphens.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    // Strip diacritics so "Café" becomes "cafe" rather than "caf".
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
