import { PageHeader } from '@/components/common/PageHeader'
import { FullPageSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EntityForm } from '@/components/common/EntityForm'
import { TextAreaField, TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { FileUploadField } from '@/components/common/FileUploadField'
import { MEDIA_FOLDERS } from '@/features/media'
import { useProfile, useProfileMutation } from '@/features/profile/hooks'
import { profileSchema, type ProfileValues } from '@/schemas'
import type { Profile } from '@/types/entities'

/** Placeholder values for a profile that has never been saved. */
const EMPTY_PROFILE: ProfileValues = {
  fullName: '',
  headline: '',
  shortBio: '',
  bio: '',
  location: '',
  email: '',
  phone: '',
  availabilityStatus: '',
  avatarPath: '',
  coverPath: '',
  resumePath: '',
  yearsOfExperience: undefined,
}

/**
 * A stored profile as the form wants it.
 *
 * Optional columns arrive as `null` and are mapped to `''`, because that is the only thing
 * an `<input>` can hold; `toDatabaseRow` turns `''` back into `NULL` on the way to Postgres.
 * `yearsOfExperience` is left `undefined` rather than `0` so an unset value is not
 * indistinguishable from a genuine zero.
 */
function profileToFormValues(profile: Profile | null): ProfileValues {
  if (!profile) return EMPTY_PROFILE

  return {
    fullName: profile.fullName,
    headline: profile.headline ?? '',
    shortBio: profile.shortBio ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    availabilityStatus: profile.availabilityStatus ?? '',
    avatarPath: profile.avatarPath ?? '',
    coverPath: profile.coverPath ?? '',
    resumePath: profile.resumePath ?? '',
    yearsOfExperience: profile.yearsOfExperience ?? undefined,
  }
}

/** A small labelled group of related fields, grouped for both reading and screen readers. */
function FieldGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">{title}</legend>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {children}
    </fieldset>
  )
}

/**
 * The one screen that edits the owner's own details.
 *
 * `profile` is a single row, so this is a form on a page rather than a table with a dialog —
 * the same wiring as `EntityDialog`, in `EntityForm`.
 */
export default function ProfilePage() {
  const profile = useProfile()
  const save = useProfileMutation()

  if (profile.isPending) {
    return <FullPageSpinner label="Loading your profile…" />
  }

  if (profile.error) {
    return <ErrorState message="Could not load your profile." onRetry={() => void profile.refetch()} />
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your name, bio, and contact details. These appear in the site header, hero, and about page."
      />

      <EntityForm
        title="Your details"
        description="Only the name is required. Everything else is optional and falls back to something sensible when blank."
        schema={profileSchema}
        defaultValues={profileToFormValues(profile.data)}
        onSubmit={async (values) => {
          await save.mutateAsync(values)
        }}
        isBusy={save.isPending}
      >
        <FieldGroup title="Identity" description="The first thing a visitor reads.">
          <TextField name="fullName" label="Full name" required autoComplete="name" />
          <TextField
            name="headline"
            label="Headline"
            placeholder="Flutter & Front-End Developer"
            description="One line, shown under your name."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="location" label="Location" autoComplete="address-level2" />
            <NumberField name="yearsOfExperience" label="Years of experience" min={0} />
          </div>
        </FieldGroup>

        <FieldGroup title="About you">
          <TextAreaField
            name="shortBio"
            label="Short bio"
            rows={3}
            description="One or two sentences, used where space is tight."
          />
          <TextAreaField
            name="bio"
            label="Full bio"
            rows={8}
            description="The longer version. Line breaks are preserved; HTML is not rendered."
          />
          <TextField
            name="availabilityStatus"
            label="Availability"
            placeholder="Available for new projects"
            description="Shown as a badge when enabled in the site settings."
          />
        </FieldGroup>

        <FieldGroup title="Photos and documents">
          <ImageUploadField
            name="avatarPath"
            label="Avatar"
            folder={MEDIA_FOLDERS.profile}
            description="Your photo. The public hero falls back to your initials without one."
          />
          <ImageUploadField
            name="coverPath"
            label="About page cover"
            folder={MEDIA_FOLDERS.profile}
            description="Optional banner at the top of your about page."
          />
          <FileUploadField
            name="resumePath"
            label="Resume"
            folder={MEDIA_FOLDERS.profile}
            description="Optional. Without one, the hero hides its download button."
          />
        </FieldGroup>

        <FieldGroup title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="email" label="Email" type="email" autoComplete="email" />
            <TextField name="phone" label="Phone" type="tel" autoComplete="tel" />
          </div>
        </FieldGroup>
      </EntityForm>
    </>
  )
}
