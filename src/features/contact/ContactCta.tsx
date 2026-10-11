import { Mail } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { ExternalLinkButton, LinkButton } from '@/components/ui/link-button'
import { PUBLIC_ROUTES } from '@/constants/routes'
import type { Profile } from '@/types/entities'

/**
 * Closing call to action.
 *
 * Shows the direct email address when the profile has one, because some visitors prefer a
 * mail client to a form. The form is always offered as well.
 */
export function ContactCta({ profile }: { profile: Profile }) {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl space-y-4 border-t border-border pt-10">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            Contact
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Get in touch</h2>
          <p className="text-muted-foreground">
            Have a project in mind, or just want to say hello? I read every message.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
            <LinkButton to={PUBLIC_ROUTES.contact}>
              <Mail className="size-4" aria-hidden="true" />
              Contact form
            </LinkButton>

            {profile.email ? (
              <ExternalLinkButton href={`mailto:${profile.email}`} variant="link">
                {profile.email}
              </ExternalLinkButton>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  )
}
