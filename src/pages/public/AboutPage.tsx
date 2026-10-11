import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { FieldSelector } from '@/components/common/FieldSelector'
import { ImageLightbox } from '@/components/common/ImageLightbox'
import { Container, ProseContainer, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { ErrorState } from '@/components/common/ErrorState'
import { FIELD_LABELS, FIELD_OPTIONS, ALL_FIELDS, type FieldFilter } from '@/constants/fields'
import { useAboutSections } from '@/features/about'
import { useProfile } from '@/features/profile'
import { SkillsByCategory, filterSkillsByField, useSkills } from '@/features/skills'
import { usePageSeo } from '@/hooks/useSeo'
import { imageUrl } from '@/services/mediaUrls'
import { toErrorMessage } from '@/lib/errors'

/**
 * About page: the long bio, the editable about sections, and the full skill set.
 *
 * Composed from features. The profile supplies the identity and the summary; the
 * `about_sections` rows supply whatever else the owner wants to say, in their own order.
 */
export default function AboutPage() {
  const profile = useProfile()
  const sections = useAboutSections()
  const skills = useSkills()
  const [isProfileImagePreviewOpen, setIsProfileImagePreviewOpen] = useState(false)
  // Which field's skills are shown below. "All" is the default so every skill is visible
  // until the visitor narrows it down.
  const [field, setField] = useState<FieldFilter>('all')
  const profileImage = imageUrl(profile.data?.coverPath)

  const allSkills = skills.data ?? []

  /*
    Only offer a field that actually has skills. A fresh install has none, and showing an
    ELV button that leads to an empty list would advertise content the owner has not written
    yet. "All" stays as long as there is anything to show.
  */
  const availableFields = FIELD_OPTIONS.filter((option) =>
    allSkills.some((skill) => skill.field === option),
  )
  const filterOptions: FieldFilter[] = [ALL_FIELDS, ...availableFields]

  // If the selected field lost its last skill (or was never offered), fall back to "All"
  // rather than leaving nothing highlighted.
  const activeField = filterOptions.includes(field) ? field : ALL_FIELDS
  const visibleSkills = filterSkillsByField(allSkills, activeField)

  usePageSeo({
    section: profile.data?.fullName ? `About ${profile.data.fullName}` : 'About',
    description: profile.data?.shortBio || 'Background, skills, and experience.',
  })

  return (
    <>
      <Section className="border-b">
        <Container>
          <SectionHeading
            title="About"
            description={
              profile.data?.headline ??
              'A little about who I am and what I work on.'
            }
            headingLevel="h1"
          />

          {profile.isError ? (
            <ErrorState
              message={toErrorMessage(profile.error, 'Could not load the profile.')}
              onRetry={() => void profile.refetch()}
            />
          ) : null}

          {profile.isLoading ? (
            <div className="bg-muted h-40 w-full animate-pulse rounded-lg" aria-hidden="true" />
          ) : null}

          {profile.data ? (
            <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
              <ProseContainer className="space-y-4">
                {profile.data.bio ? (
                  <p className="text-muted-foreground whitespace-pre-line">{profile.data.bio}</p>
                ) : profile.data.shortBio ? (
                  <p className="text-muted-foreground">{profile.data.shortBio}</p>
                ) : (
                  <p className="text-muted-foreground">No bio has been written yet.</p>
                )}

                {profile.data.location || profile.data.email ? (
                  <p className="text-muted-foreground text-sm">
                    {[profile.data.location, profile.data.email].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
              </ProseContainer>

              {profileImage ? (
                <>
                  <button
                    type="button"
                    className="group mx-auto aspect-square w-full max-w-64 rounded-full focus-visible:outline-ring"
                    onClick={() => setIsProfileImagePreviewOpen(true)}
                    aria-label={`Preview ${profile.data.fullName || 'profile'} image`}
                  >
                    <img
                      src={profileImage}
                      alt=""
                      className="border-border h-full w-full rounded-full border object-cover transition duration-(--motion-duration) group-hover:brightness-95"
                    />
                  </button>

                  <ImageLightbox
                    images={[
                      {
                        src: profileImage,
                        alt: profile.data.fullName ? `${profile.data.fullName}'s profile image` : 'Profile image',
                        label: profile.data.fullName ? `${profile.data.fullName}'s profile image` : 'Profile image',
                      },
                    ]}
                    currentIndex={isProfileImagePreviewOpen ? 0 : null}
                    onChange={() => {}}
                    onClose={() => setIsProfileImagePreviewOpen(false)}
                  />
                </>
              ) : null}
            </div>
          ) : null}
        </Container>
      </Section>

      {/*
        Owner-written blocks, in sort order. The three states are handled here rather than
        through `QueryState` because no section is a normal outcome on a fresh install — the
        profile and skills are what a visitor came for, so an absent about section shows
        nothing at all instead of an empty-state box in the middle of the page.
      */}
      {sections.isLoading ? (
        <Section>
          <Container>
            <div className="bg-muted h-40 w-full animate-pulse rounded-lg" aria-hidden="true" />
          </Container>
        </Section>
      ) : null}

      {sections.isError ? (
        <Section>
          <Container>
            <ErrorState
              message={toErrorMessage(sections.error, 'Could not load the about content.')}
              onRetry={() => void sections.refetch()}
            />
          </Container>
        </Section>
      ) : null}

      {sections.data?.map((section) => (
        <Section key={section.id} className="border-b last:border-b-0">
          <Container>
            <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
                <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
              </div>

              {section.imagePath ? (
                <img
                  src={imageUrl(section.imagePath) ?? undefined}
                  alt=""
                  className="border-border w-full rounded-lg border object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
          </Container>
        </Section>
      ))}

      <Section>
        <Container>
          <SectionHeading
            title="Skills"
            description="Tools and technologies I use, grouped by category."
            headingLevel="h2"
          >
            {availableFields.length > 0 ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">Skills field</p>
                <FieldSelector
                  value={activeField}
                  onChange={setField}
                  includeAll
                  options={filterOptions}
                  ariaLabel="Filter skills by field"
                />
              </div>
            ) : null}
          </SectionHeading>

          <QueryState
            isLoading={skills.isLoading}
            isError={skills.isError}
            error={skills.error}
            data={visibleSkills}
            skeletonRows={3}
            emptyTitle={
              activeField === 'all'
                ? 'No skills added yet'
                : `No ${FIELD_LABELS[activeField]} skills added yet`
            }
            emptyDescription="Skills will appear here once they are published."
            emptyIcon={Sparkles}
            onRetry={() => void skills.refetch()}
          >
            {(data) => <SkillsByCategory skills={data} />}
          </QueryState>
        </Container>
      </Section>
    </>
  )
}
