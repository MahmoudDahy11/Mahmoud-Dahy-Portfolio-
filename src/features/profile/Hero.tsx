import { useState } from 'react'
import { ArrowRight, MapPin, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { ImageLightbox } from '@/components/common/ImageLightbox'
import { Container } from '@/components/common/Section'
import { DestinationButton, LinkButton } from '@/components/ui/link-button'
import { PUBLIC_ROUTES } from '@/constants/routes'
import { useSiteSettings } from '@/features/settings'
import { fileUrl, imageUrl } from '@/services/mediaUrls'
import type { Profile } from '@/types/entities'

/**
 * The hero at the top of the home page.
 *
 * Every value comes from the `profile` row. When that row does not exist yet the section
 * renders the calls to action without a name, rather than showing placeholder text that
 * would look like real content.
 */
export function Hero({ profile }: { profile: Profile }) {
  const resume = fileUrl(profile.resumePath)
  const resumeElv = fileUrl(profile.resumeElvPath)
  const avatar = imageUrl(profile.avatarPath)
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false)
  const settings = useSiteSettings()

  /*
    The badge needs two things to agree. The profile carries the *text* — the owner writes
    "Available for new projects" — and the site settings carry the *switch*, so it can be
    turned off site-wide without deleting that text and losing it. Either one being off
    hides the badge, which is why clearing the status field also works: the text is gone, so
    there is nothing to show.
  */
  const availability = profile.availabilityStatus?.trim()
  const showAvailability = Boolean(availability) && settings.data?.showAvailabilityBadge !== false

  return (
    <section className="animate-fade-rise border-b">
      <Container className="flex flex-col items-start gap-8 py-16 sm:py-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {avatar ? (
            <>
              <button
                type="button"
                className="group rounded-full focus-visible:outline-ring"
                onClick={() => setIsAvatarPreviewOpen(true)}
                aria-label={`Preview ${profile.fullName || 'profile'} image`}
              >
                <Avatar
                  path={profile.avatarPath}
                  fullName={profile.fullName}
                  className="size-20 rounded-full text-2xl transition duration-(--motion-duration) group-hover:brightness-95 sm:size-24"
                />
              </button>

              <ImageLightbox
                images={[
                  {
                    src: avatar,
                    alt: profile.fullName ? `${profile.fullName}'s profile image` : 'Profile image',
                    label: profile.fullName ? `${profile.fullName}'s profile image` : 'Profile image',
                  },
                ]}
                currentIndex={isAvatarPreviewOpen ? 0 : null}
                onChange={() => {}}
                onClose={() => setIsAvatarPreviewOpen(false)}
              />
            </>
          ) : (
            <Avatar
              path={profile.avatarPath}
              fullName={profile.fullName}
              className="size-20 rounded-full text-2xl sm:size-24"
            />
          )}

          <div className="space-y-3">
            {/*
              Two switches have to agree: the owner has written a status, and the site
              settings allow the badge to be shown at all.
            */}
            {showAvailability && availability ? (
              <p className="text-accent-foreground bg-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {availability}
                {profile.yearsOfExperience ? ` · ${profile.yearsOfExperience}+ years` : null}
              </p>
            ) : null}

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {profile.fullName || 'Welcome'}
            </h1>

            {profile.headline ? (
              <p className="text-muted-foreground text-lg">{profile.headline}</p>
            ) : null}

            {profile.location ? (
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <MapPin className="size-4" aria-hidden="true" />
                {profile.location}
              </p>
            ) : null}
          </div>
        </div>

        {profile.shortBio ? (
          <p className="text-muted-foreground max-w-2xl text-base">{profile.shortBio}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <LinkButton to={PUBLIC_ROUTES.projects}>
            View my work
            <ArrowRight className="size-4" aria-hidden="true" />
          </LinkButton>

          <LinkButton to={PUBLIC_ROUTES.contact} variant="outline">
            Get in touch
          </LinkButton>

          {/* Each CV is stored separately, so each button appears only when its own file
              exists. The Flutter and ELV résumés are managed and downloaded independently. */}
          {resume ? (
            <DestinationButton to={resume} variant="ghost">
              Flutter CV
            </DestinationButton>
          ) : null}

          {resumeElv ? (
            <DestinationButton to={resumeElv} variant="ghost">
              ELV CV
            </DestinationButton>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
