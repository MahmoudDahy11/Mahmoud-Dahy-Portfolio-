/**
 * Deciding whether a URL leaves the site.
 *
 * Three different places need this answer — `LinkButton`, `useSeo`, and the social links —
 * and they must agree. If one treated `mailto:` as internal and another as external, the
 * same link would be a React Router navigation in one component and a plain anchor in
 * another, and React Router would try to route to a string that is not a path.
 *
 * The test is on the raw string, not on a parsed URL. Resolving against a base first is the
 * obvious approach and it is wrong: `new URL('/projects', 'http://example.com')` reports the
 * protocol `http:`, so every internal path would be classified as external and handed to an
 * anchor instead of the router. What distinguishes them is whether the *value the owner
 * typed* carries a scheme, so that is what is checked.
 */

/** A leading scheme, per RFC 3986: `https:`, `mailto:`, `tel:`. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * A protocol-relative URL, `//example.com/x`. It has no scheme of its own but still leaves
 * the site, and it is the one form a naive `startsWith('/')` path check misclassifies.
 */
const PROTOCOL_RELATIVE = /^\/\//

/** Schemes that hand control to another application rather than to the browser. */
const HANDOFF_SCHEME = /^(?:mailto|tel):/i

export function destinationFor(destination: string): { href: string; external: boolean } {
  const trimmed = destination.trim()

  const external = HAS_SCHEME.test(trimmed) || PROTOCOL_RELATIVE.test(trimmed)

  return { href: trimmed, external }
}

/**
 * Whether a link should warn that it opens a new tab.
 *
 * `mailto:` and `tel:` are external, but they do not open a browser tab, so the warning
 * would be wrong for them.
 */
export function opensNewTab(destination: string): boolean {
  const { href, external } = destinationFor(destination)
  return external && !HANDOFF_SCHEME.test(href)
}
