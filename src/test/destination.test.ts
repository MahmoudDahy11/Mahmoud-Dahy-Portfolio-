import { describe, expect, it } from 'vitest'
import { destinationFor, opensNewTab } from '@/lib/destination'

/**
 * `destinationFor` decides whether a database-supplied URL becomes a React Router link or a
 * plain anchor.
 *
 * Getting this wrong is not cosmetic. A `mailto:` value classified as internal is handed to
 * the router, which treats it as a path and silently navigates nowhere. An `https://` value
 * classified as internal does the same. Both are values the owner types into the admin
 * dashboard, so neither can be ruled out by assuming well-formed input.
 */
describe('destinationFor', () => {
  it.each([
    ['/projects', false],
    ['/projects/some-slug', false],
    ['/', false],
    ['#section', false],
    ['', false],
    ['   ', false],
  ])('treats %o as internal (%s)', (value, expected) => {
    expect(destinationFor(value).external).toBe(expected)
  })

  it.each([
    ['https://github.com/example', true],
    ['http://example.com', true],
    ['mailto:someone@example.com', true],
    ['tel:+1234567890', true],
    ['//example.com/path', true],
    ['HTTPS://EXAMPLE.COM', true],
  ])('treats %o as external (%s)', (value, expected) => {
    expect(destinationFor(value).external).toBe(expected)
  })

  it('never rewrites the href, only classifies it', () => {
    // The router needs the original string, and an external anchor needs it verbatim.
    // Normalising here would break one of the two.
    expect(destinationFor('  /projects  ').href).toBe('/projects')
    expect(destinationFor('mailto:a@b.com').href).toBe('mailto:a@b.com')
  })

  it('falls back to internal for an unparseable value rather than throwing', () => {
    // A stray value in the database must not crash a page render. Treating it as a path is
    // the safe failure: the link is inert, and the page still works.
    expect(() => destinationFor('http://')).not.toThrow()
    expect(destinationFor('http://').external).toBe(true)
    expect(() => destinationFor(':::')).not.toThrow()
  })
})

describe('opensNewTab', () => {
  it('is true only for destinations that open a browser tab', () => {
    expect(opensNewTab('https://example.com')).toBe(true)
    expect(opensNewTab('//example.com')).toBe(true)
  })

  it('is false for mailto and tel, which hand off to another application', () => {
    // Announcing "opens in a new tab" for an email link is a small lie, and it is the kind
    // of small lie that makes screen-reader users distrust the rest of the page.
    expect(opensNewTab('mailto:someone@example.com')).toBe(false)
    expect(opensNewTab('tel:+1234567890')).toBe(false)
  })

  it('is false for internal paths', () => {
    expect(opensNewTab('/projects')).toBe(false)
  })
})
