import { Link } from 'react-router-dom'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'
import { destinationFor } from '@/lib/destination'

/**
 * A navigation link that looks like a button.
 *
 * This exists instead of `<Button render={<Link />} />` because Base UI's Button sets
 * `role="button"` on whatever it renders. On an anchor that is a genuine accessibility
 * defect: assistive technology announces the control as a button rather than a link, and
 * a user who navigates by pulling up a list of links will not find it at all. The primary
 * calls to action on every public page are exactly the links a user would expect to find
 * there.
 *
 * The visual result is identical, because it reuses the same `buttonVariants` the Button
 * uses. Only the semantics differ, and they differ correctly.
 *
 * A real `<Button>` is still the right choice for something that performs an action —
 * filtering the project list, submitting a form, opening a dialog.
 */

const VARIANT_CLASSES = buttonVariants()

type CommonProps = {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
  className?: string
  children: React.ReactNode
}

/** An in-app link. `to` is a path, not a URL. */
export function LinkButton({
  to,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CommonProps & { to: string }) {
  return (
    <Link to={to} className={cn(VARIANT_CLASSES, buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  )
}

/**
 * An external link.
 *
 * `rel="noreferrer"` is not optional here: the `noopener` half stops the opened page from
 * reaching back through `window.opener`, and `noreferrer` additionally withholds the
 * referrer. The "opens in a new tab" text is sr-only because the visible label should stay
 * short, but a screen-reader user still needs to know the context will change.
 */
export function ExternalLinkButton({
  href,
  variant = 'outline',
  size = 'default',
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(VARIANT_CLASSES, buttonVariants({ variant, size }), className)}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/**
 * A link that may be internal or external, decided by the destination.
 *
 * The caller passes a `to` that is sometimes a path and sometimes a full URL, which is what
 * the database hands back for fields like `repository_url` and `profile.resume_path`. Rather
 * than make every call site branch on that, this picks the right element. `destinationFor`
 * is the single place that decides what counts as internal.
 */
export function DestinationButton({
  to,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CommonProps & { to: string }) {
  const { href, external } = destinationFor(to)

  if (!external) {
    return (
      <LinkButton to={href} variant={variant} size={size} className={className}>
        {children}
      </LinkButton>
    )
  }

  return (
    <ExternalLinkButton href={href} variant={variant} size={size} className={className}>
      {children}
    </ExternalLinkButton>
  )
}
