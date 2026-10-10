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
        <div className="border-border bg-card flex flex-col items-start gap-4 rounded-lg border p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Get in touch</h2>
            <p className="text-muted-foreground">
              Have a project in mind, or just want to say hello? I read every message.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <LinkButton to={PUBLIC_ROUTES.contact}>
              <Mail className="size-4" aria-hidden="true" />
              Contact form
            </LinkButton>

            {profile.email ? (
              <ExternalLinkButton href={`mailto:${profile.email}`} variant="outline">
                {profile.email}
              </ExternalLinkButton>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  )
}
