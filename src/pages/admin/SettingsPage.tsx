import { PageHeader } from '@/components/common/PageHeader'
import { FullPageSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EntityForm } from '@/components/common/EntityForm'
import { SwitchField, TextAreaField, TextField } from '@/components/common/FormField'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { MEDIA_FOLDERS } from '@/features/media'
import { useSiteSettings, useSiteSettingsMutation } from '@/features/settings/hooks'
import { siteSettingsSchema, type SiteSettingsValues } from '@/schemas'
import type { SiteSettings } from '@/types/entities'

/** Defaults for a settings row that has never been saved. */
const EMPTY_SETTINGS: SiteSettingsValues = {
  siteTitle: '',
  metaDescription: '',
  footerText: '',
  copyrightText: '',
  ogImagePath: '',
  defaultTheme: 'system',
  showAvailabilityBadge: true,
}

/**
 * A stored settings row as the form wants it. `ogImagePath` is `null` until an image is
 * uploaded, and the schema types it as a string because an input can only produce one.
 */
function settingsToFormValues(settings: SiteSettings | null): SiteSettingsValues {
  if (!settings) return EMPTY_SETTINGS

  return {
    siteTitle: settings.siteTitle,
    metaDescription: settings.metaDescription ?? '',
    footerText: settings.footerText ?? '',
    copyrightText: settings.copyrightText ?? '',
    ogImagePath: settings.ogImagePath ?? '',
    defaultTheme: settings.defaultTheme,
    showAvailabilityBadge: settings.showAvailabilityBadge,
  }
}

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">{title}</legend>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {children}
    </fieldset>
  )
}

/**
 * Site-wide settings.
 *
 * A single row, so this is one form on a page rather than a table with a dialog. Every field
 * here changes something the public site displays — the browser tab, the footer, the social
 * preview card, or the availability badge — which is why each one says what it affects.
 */
export default function SettingsPage() {
  const settings = useSiteSettings()
  const save = useSiteSettingsMutation()

  if (settings.isPending) {
    return <FullPageSpinner label="Loading site settings…" />
  }

  if (settings.error) {
    return (
      <ErrorState message="Could not load the site settings." onRetry={() => void settings.refetch()} />
    )
  }

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Values applied across the whole site: the browser tab, the footer, and how your links look when shared."
      />

      <EntityForm
        title="Site-wide configuration"
        description="These are not per-page. A page that has its own description or image keeps it."
        schema={siteSettingsSchema}
        defaultValues={settingsToFormValues(settings.data)}
        onSubmit={async (values) => {
          await save.mutateAsync(values)
        }}
        isBusy={save.isPending}
      >
        <FieldGroup
          title="Search and sharing"
          description="What a visitor sees in the browser tab and on social media."
        >
          <TextField
            name="siteTitle"
            label="Site title"
            required
            description="Appended to every page title, and used in the header and footer."
          />
          <TextAreaField
            name="metaDescription"
            label="Default meta description"
            rows={3}
            description="Used by any page that does not have a description of its own. Aim for 150–160 characters."
          />
          <ImageUploadField
            name="ogImagePath"
            label="Social preview image"
            folder={MEDIA_FOLDERS.profile}
            description="Shown when someone shares a link. 1200×630 works well."
          />
        </FieldGroup>

        <FieldGroup title="Footer">
          <TextField name="footerText" label="Footer text" description="A short line above the copyright." />
          <TextField
            name="copyrightText"
            label="Copyright text"
            description="Leave blank to show the year and site title automatically."
          />
        </FieldGroup>

        <FieldGroup title="Home page">
          <SwitchField
            name="showAvailabilityBadge"
            label="Show the availability badge"
            description="Whether the badge beside your name appears. The text itself is set in your profile."
          />
        </FieldGroup>
      </EntityForm>
    </>
  )
}
