import { Mail, MapPin, Phone } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { ContactForm } from '@/features/contact'
import { useProfile } from '@/features/profile'
import { SocialLinks } from '@/features/socialLinks'
import { usePageSeo } from '@/hooks/useSeo'
import { SkeletonList } from '@/components/common/LoadingState'

/**
 * Contact page: direct details beside the form.
 *
 * The email address is always shown even before a message is written, because a visitor
 * with something urgent should not have to trust that a form submission will arrive.
 */
export default function ContactPage() {
  const profile = useProfile()

  usePageSeo({
    section: 'Contact',
    description: 'Get in touch about projects, work, or questions.',
  })

  return (
    <Section>
      <Container>
        <div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Contact</h1>
              <p className="text-muted-foreground">
                Send a message and it will arrive in my inbox. I read everything and reply to
                most of it.
              </p>
            </div>

            {profile.isLoading ? <SkeletonList rows={2} /> : null}

            {profile.data ? (
              <address className="space-y-3 not-italic">
                {profile.data.email ? (
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                    <a href={`mailto:${profile.data.email}`} className="hover:underline">
                      {profile.data.email}
                    </a>
                  </p>
                ) : null}

                {profile.data.phone ? (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                    <a href={`tel:${profile.data.phone}`} className="hover:underline">
                      {profile.data.phone}
                    </a>
                  </p>
                ) : null}

                {profile.data.location ? (
                  <p className="flex items-center gap-2 text-sm">
                    <MapPin className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                    {profile.data.location}
                  </p>
                ) : null}
              </address>
            ) : null}

            {/*
              Social links are a separate query from the profile, so they render
              independently: a slow links query must not hold back the email address.
            */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Elsewhere</h2>
              <SocialLinks variant="detailed" />
            </div>
          </div>

          <div className="border border-border p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </Container>
    </Section>
  )
}
