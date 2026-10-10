import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useNoIndex, useSeo } from '@/hooks/useSeo'

/**
 * Checks on the `<head>` manipulation in `useSeo`.
 *
 * The hook writes tags imperatively, so the assertion target is the DOM itself: the title,
 * the meta tags, the canonical link, and the structured-data script. A test component per
 * case keeps each scenario's `useSeo` call visible.
 */

function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Sample Person',
    jobTitle: 'Software Developer',
  }
}

function SeoProbe({ jsonLd }: { jsonLd?: Record<string, unknown> | null }) {
  useSeo({
    title: 'Probe title',
    description: 'Probe description.',
    jsonLd,
  })

  return <p>Probe content</p>
}

function NoIndexProbe() {
  useNoIndex()

  return <p>No index content</p>
}

function robotsMeta() {
  return document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
}

describe('useSeo', () => {
  it('sets the title, description, canonical, and Open Graph tags', () => {
    render(<SeoProbe />)

    expect(document.title).toBe('Probe title')
    expect(
      document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
    ).toBe('Probe description.')
    expect(
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    ).toMatch(/\/$/)
    expect(
      document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content,
    ).toBe('Probe title')
  })

  it('writes jsonLd into a script tag and updates it when the data changes', () => {
    const first = personLd()
    const second = { ...personLd(), name: 'Renamed Person' }

    const view = render(<SeoProbe jsonLd={first} />)

    const script = document.head.querySelector<HTMLScriptElement>('script#application-ld-json')
    expect(script?.type).toBe('application/ld+json')
    expect(JSON.parse(script?.textContent ?? 'null')).toEqual(first)

    view.rerender(<SeoProbe jsonLd={second} />)
    expect(JSON.parse(script?.textContent ?? 'null')).toEqual(second)

    // One tag, not one per render.
    expect(document.head.querySelectorAll('script#application-ld-json').length).toBe(1)
  })

  it('removes the script tag when jsonLd becomes null', () => {
    const view = render(<SeoProbe jsonLd={personLd()} />)

    expect(document.head.querySelector('script#application-ld-json')).not.toBeNull()

    view.rerender(<SeoProbe jsonLd={null} />)
    expect(document.head.querySelector('script#application-ld-json')).toBeNull()
  })

  it('does not write a script tag when no jsonLd is supplied', () => {
    render(<SeoProbe />)

    expect(document.head.querySelector('script#application-ld-json')).toBeNull()
    expect(screen.getByText('Probe content')).toBeInTheDocument()
  })
})

describe('useNoIndex', () => {
  it('marks the page as noindex, nofollow', () => {
    render(<NoIndexProbe />)

    expect(robotsMeta()?.content).toBe('noindex, nofollow')
  })
})
