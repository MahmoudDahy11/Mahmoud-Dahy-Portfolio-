import { QueryValue } from '@/components/common/QueryState'
import { useSiteSettings } from '@/features/settings'
import type { SiteSettings } from '@/types/entities'

/**
 * Footer text, driven by `site_settings`.
 *
 * Reads one record, so `QueryValue` rather than `QueryState`. When the owner has not
 * created the row the query returns `null` and this renders nothing, leaving the default
 * copyright in the layout.
 */
export function SiteFooter() {
  const settings = useSiteSettings()

  return (
    <QueryValue isLoading={settings.isLoading} isError={settings.isError} error={settings.error} data={settings.data}>
      {(data: SiteSettings) =>
        data.footerText ? <p className="max-w-prose">{data.footerText}</p> : null
      }
    </QueryValue>
  )
}
