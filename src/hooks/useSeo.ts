import { useEffect } from 'react'
import { useSiteSettings } from '@/features/settings'
import { imageUrl } from '@/services/mediaUrls'

type SeoOptions = {
  title: string
  description?: string
  /** Absolute or root-relative image path for social previews. */
  image?: string
  /** Set to false for admin pages so they are not indexed. */
  noIndex?: boolean
  type?: 'website' | 'article'
  /**
   * Structured data, serialised into one `<script type="application/ld+json">` tag.
   * Pass `null` to remove it when the data it was built from disappears.
   */
  jsonLd?: Record<string, unknown> | null
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173'

function absoluteUrl(path?: string) {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return new URL(path, SITE_URL).toString()
}

/**
 * Sets a single `<meta>` tag, creating it if needed.
 *
 * React does not manage `<head>` contents, so tags are updated imperatively. Setting the
 * same attribute twice replaces it, which keeps this idempotent across re-renders.
 */
function setMeta(selector: string, attribute: 'name' | 'property', key: string, content?: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!content) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setCanonical(url?: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!url) {
    link?.remove()
    return
  }

  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }

  link.href = url
}

/**
 * Sets the single structured-data script tag.
 *
 * One tag per page, kept under a fixed id rather than appended, because two
 * `application/ld+json` blocks describing the same page would be ambiguous and a second
 * copy left behind after a navigation would describe the page the visitor no longer sees.
 */
function setJsonLd(jsonLd?: Record<string, unknown> | null) {
  let script = document.head.querySelector<HTMLScriptElement>('script#application-ld-json')

  if (!jsonLd) {
    script?.remove()
    return
  }

  if (!script) {
    script = document.createElement('script')
    script.id = 'application-ld-json'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(jsonLd)
}

/**
 * Marks the current route as private.
 *
 * The admin dashboard is useful to find only if you already know the URL, so it opts out
 * of indexing rather than relying on `robots.txt` alone: a crawler that has already indexed
 * the page keeps returning unless the page itself says otherwise.
 */
export function useNoIndex() {
  useEffect(() => {
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')

    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }

    meta.content = 'noindex, nofollow'
  }, [])
}

/**
 * Applies page metadata: title, description, canonical URL, Open Graph, and Twitter card.
 *
 * Called by each page rather than configured centrally, because the values differ per
 * page and per record. For a project page the title comes from the project itself.
 *
 * Note the limitation: this is a client-rendered application, so a crawler that does not
 * execute JavaScript sees only the baseline metadata in index.html. That is accepted and
 * documented in ARCHITECTURE.md section 11.
 */
export function useSeo({
  title,
  description,
  image,
  noIndex = false,
  type = 'website',
  jsonLd,
}: SeoOptions) {
  useEffect(() => {
    document.title = title

    const canonical = absoluteUrl(window.location.pathname)
    const absoluteImage = absoluteUrl(image)

    setCanonical(canonical)
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:type"]', 'property', 'og:type', type)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMeta('meta[property="og:image"]', 'property', 'og:image', absoluteImage)

    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteImage)

    setJsonLd(jsonLd)
  }, [title, description, image, noIndex, type, jsonLd])
}

type PageSeoOptions = Omit<SeoOptions, 'title'> & {
  /** The page's own part of the title, e.g. "Projects". */
  section: string
  /** When true the site name is not appended, for a page that already names the record. */
  bare?: boolean
}

/**
 * Applies metadata for a page whose title should end with the site's own name.
 *
 * The site name comes from `site_settings.site_title`, which the owner edits in the admin
 * dashboard. Hardcoding "Portfolio" into every page would make that column decorative: it
 * would change the header and the footer but never the browser tab, which is the one place
 * somebody actually reads it.
 *
 * The site-wide meta description and social image are read from the same row for the same
 * reason. A page that supplies neither falls back to them, so an owner who writes one good
 * description in the admin covers every page that has nothing more specific to say. Pages
 * that do pass their own values keep them — `??` rather than `||`, so a deliberate empty
 * string still means "no description" and does not get silently replaced.
 *
 * The suffix is omitted until the settings query resolves, so the tab shows "Projects" for
 * a moment rather than "Projects — " with a dangling dash.
 */
export function usePageSeo({ section, bare = false, description, image, ...rest }: PageSeoOptions) {
  const settings = useSiteSettings()
  const siteName = settings.data?.siteTitle?.trim()

  useSeo({
    ...rest,
    title: bare || !siteName ? section : `${section} — ${siteName}`,
    description: description ?? settings.data?.metaDescription ?? undefined,
    image: image ?? imageUrl(settings.data?.ogImagePath) ?? undefined,
  })
}
