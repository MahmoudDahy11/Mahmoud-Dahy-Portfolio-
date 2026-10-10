import { AtSign, CodeXml, Globe, Link, Mail, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { QueryValue } from '@/components/common/QueryState'
import { opensNewTab } from '@/lib/destination'
import { useSocialLinks } from './hooks'
import type { SocialLink } from '@/types/entities'

/**
 * The owner's social links.
 *
 * `lucide-react` v1 removed brand icons, so there is no GitHub or LinkedIn glyph to use.
 * Adding an icon library purely to recover three logos would be the wrong trade, and a
 * hand-rolled SVG per platform would be a maintenance burden for a decorative detail. Each
 * platform is therefore mapped to a generic icon that signals the right kind of link, and
 * the link's real name is carried by screen-reader text instead.
 *
 * A platform that is not listed falls back to a generic link icon rather than being
 * hidden. The owner adds these rows through the admin dashboard, so an unrecognised value
 * must still produce a visible link.
 */
const PLATFORM_ICONS: Record<string, LucideIcon> = {
  github: CodeXml,
  gitlab: CodeXml,
  linkedin: Users,
  x: AtSign,
  twitter: AtSign,
  mastodon: AtSign,
  email: Mail,
  website: Globe,
  blog: Globe,
}

/** Icon buttons, for the footer. */
function FooterLinks({ links }: { links: SocialLink[] }) {
  return (
    <ul className="flex items-center gap-4">
      {links.map((link) => {
        const Icon = PLATFORM_ICONS[link.platform.toLowerCase()] ?? Link

        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground transition-colors"
            >
              <Icon className="size-4" aria-hidden="true" />
              {/*
                The icon is decorative, so the link needs a real name. The visible label is
                the owner's own wording, and the platform name is appended so two links to
                the same network are still distinguishable.
              */}
              <span className="sr-only">
                {link.label} ({link.platform})
                {opensNewTab(link.url) ? ' (opens in a new tab)' : ''}
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/** Labelled links, for the contact page. */
function DetailedLinks({ links }: { links: SocialLink[] }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:underline text-sm"
          >
            {link.label}
            {opensNewTab(link.url) ? <span className="sr-only"> (opens in a new tab)</span> : null}
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Renders nothing at all until the query settles, and nothing when there are no published
 * links. An empty `ul` would otherwise leave a gap in the footer's spacing.
 */
export function SocialLinks({ variant }: { variant: 'footer' | 'detailed' }) {
  const socialLinks = useSocialLinks()

  return (
    <QueryValue
      isLoading={socialLinks.isLoading}
      isError={socialLinks.isError}
      error={socialLinks.error}
      data={socialLinks.data}
    >
      {(links: SocialLink[]) =>
        links.length === 0 ? null : variant === 'footer' ? <FooterLinks links={links} /> : <DetailedLinks links={links} />
      }
    </QueryValue>
  )
}
