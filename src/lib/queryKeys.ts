/**
 * Query keys, in one place.
 *
 * TanStack Query matches keys by prefix, so a key defined as `['projects', 'list']`
 * invalidates every project query when `queryClient.invalidateQueries({ queryKey:
 * ['projects'] })` is called. Centralising the keys is what makes that pattern reliable:
 * a typo in a string literal would otherwise silently fail to invalidate anything, and
 * the symptom would be a stale page that only looks wrong occasionally.
 *
 * Each key is a function rather than a value, because a key that can be built from an
 * argument is a key no two callers can spell differently.
 */
import type { MessageFilter } from '@/services/contactMessages'

export const queryKeys = {
  profile: () => ['profile'] as const,
  siteSettings: () => ['site-settings'] as const,

  about: {
    all: () => ['about'] as const,
    sections: () => ['about', 'sections'] as const,
  },

  skills: {
    all: () => ['skills'] as const,
    list: () => ['skills', 'list'] as const,
    categories: () => ['skills', 'categories'] as const,
  },

  projects: {
    all: () => ['projects'] as const,
    list: (options?: { featuredOnly?: boolean; limit?: number }) =>
      ['projects', 'list', options ?? {}] as const,
    bySlug: (slug: string) => ['projects', 'detail', slug] as const,
  },

  technologies: {
    all: () => ['technologies'] as const,
    filters: () => ['technologies', 'filters'] as const,
  },

  experiences: {
    all: () => ['experiences'] as const,
    list: () => ['experiences', 'list'] as const,
  },

  education: {
    all: () => ['education'] as const,
    list: () => ['education', 'list'] as const,
  },

  certificates: {
    all: () => ['certificates'] as const,
    list: () => ['certificates', 'list'] as const,
  },

  services: {
    all: () => ['services'] as const,
    list: () => ['services', 'list'] as const,
  },

  socialLinks: {
    all: () => ['social-links'] as const,
    list: () => ['social-links', 'list'] as const,
  },

  /**
   * The contact inbox.
   *
   * Filtered views are separate keys rather than one key plus a filter argument, so
   * switching tabs does not overwrite the list already fetched for the tab being left.
   */
  messages: {
    all: () => ['messages'] as const,
    list: (filter: MessageFilter) => ['messages', 'list', filter] as const,
    counts: () => ['messages', 'counts'] as const,
  },

  /**
   * The media library.
   *
   * Separate from the entity keys because it lists rows in `media`, not in a content
   * table. Saving a project also uploads a cover image, which invalidates this key so the
   * library reflects a file the owner just added.
   */
  media: {
    all: () => ['media'] as const,
    list: () => ['media', 'list'] as const,
    usage: () => ['media', 'usage'] as const,
    unrecorded: () => ['media', 'unrecorded'] as const,
  },

  /**
   * Deliberately not cached across sessions. The answer depends on who is signed in, so a
   * stale entry could show one admin the previous admin's access. `staleTime: 0` in the hook
   * plus clearing the cache on sign-out keeps it correct.
   */
  adminAccess: () => ['admin-access'] as const,

  /**
   * The dashboard overview.
   *
   * Invalidated by the message mutations alongside `messages`, because a dashboard showing
   * "3 unread" next to an inbox the owner just emptied is worse than no dashboard.
   */
  adminOverview: () => ['admin-overview'] as const,
} as const
