import { useState } from 'react'
import { ArrowRight, FileDown, MapPin, Sparkles } from 'lucide-react'
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
      <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        <div className="max-w-2xl space-y-5">
          <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            <span aria-hidden="true" className="bg-primary inline-block h-px w-8" />
            Software · ELV Engineering
          </p>

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

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {profile.fullName || 'Welcome'}
          </h1>

          {profile.headline ? (
            <p className="text-muted-foreground text-lg">{profile.headline}</p>
          ) : null}

          {profile.shortBio ? (
            <p className="text-muted-foreground text-base leading-relaxed">
              {profile.shortBio}
            </p>
          ) : null}

          {profile.location ? (
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <MapPin className="size-4" aria-hidden="true" />
              {profile.location}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <LinkButton to={PUBLIC_ROUTES.projects}>
              View my work
              <ArrowRight className="size-4" aria-hidden="true" />
            </LinkButton>

            {/* Secondary actions stay as quiet text links so the single primary
                button keeps its weight. Each CV appears only when its own file exists. */}
            <LinkButton to={PUBLIC_ROUTES.contact} variant="link">
              Get in touch
            </LinkButton>

            {resume ? (
              <DestinationButton to={resume} variant="link">
                <FileDown className="size-4" aria-hidden="true" />
                Flutter CV
              </DestinationButton>
            ) : null}

            {resumeElv ? (
              <DestinationButton to={resumeElv} variant="link">
                <FileDown className="size-4" aria-hidden="true" />
                ELV CV
              </DestinationButton>
            ) : null}
          </div>
        </div>

        {avatar ? (
          <div className="w-full max-w-72 sm:max-w-80 lg:max-w-[320px] lg:justify-self-end lg:pt-8">
            <figure>
              {/*
                Folio row above the portrait. The muted label and hairline do the
                quiet work; the orange index is the only accent, shared with the
                About page figure so the two read as one series (01 / 02).
              */}
              <div aria-hidden="true" className="mb-3 flex items-center gap-3">
                <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Portrait
                </span>
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-semibold tracking-[0.18em] text-primary">
                  01
                </span>
              </div>

              <button
                type="button"
                className="group block w-full rounded-[4px] focus-visible:outline-ring"
                onClick={() => setIsAvatarPreviewOpen(true)}
                aria-label={`Preview ${profile.fullName || 'profile'} image`}
              >
                <Avatar
                  path={profile.avatarPath}
                  fullName={profile.fullName}
                  className="aspect-[4/5] w-full rounded-[4px] border border-border object-cover object-top transition duration-(--motion-duration) group-hover:brightness-95"
                />
              </button>

              {/*
                Figure credit reuses the name and location already on the page, so
                nothing new is invented. The short orange tick ties it to the
                overline accent without adding another visual device.
              */}
              <figcaption className="mt-3 flex items-start gap-3 border-t border-border pt-3">
                <span aria-hidden="true" className="mt-[7px] h-px w-6 shrink-0 bg-primary" />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {profile.fullName}
                  {profile.location ? ` — ${profile.location}` : null}
                </span>
              </figcaption>
            </figure>

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
          </div>
        ) : (
          <Avatar
            path={profile.avatarPath}
            fullName={profile.fullName}
            className="size-36 rounded-full text-3xl sm:size-44 lg:justify-self-end"
          />
        )}
      </Container>
    </section>
  )
}
