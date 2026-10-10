import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { File as NativeFile } from 'node:buffer'
import { getSupabaseClient } from '@/lib/supabase'
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectBySlug,
  getTechnologies,
  updateProject,
} from '@/services/projects'
import {
  deleteContactMessage,
  getContactMessages,
  submitContactMessage,
  updateContactMessage,
} from '@/services/contactMessages'
import { deleteMediaAsset, getMediaAssets, uploadMedia } from '@/services/media'
import { getMediaUsage } from '@/services/mediaUsage'
import { getUnrecordedObjects } from '@/services/mediaOrphans'
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from '@/constants/storage'
import type { ProjectValues } from '@/schemas/project'
import type { MediaAsset } from '@/types/entities'

/**
 * End-to-end checks of the admin write paths against the real Supabase project.
 *
 * `live-api.test.ts` proves the public site can *read*. It says nothing about writing, and
 * writing is where this application's risk sits: the columns the dashboard sends, the three
 * writes a project save really is, the storage upload, and — most importantly — Row Level
 * Security holding up when the operations are issued through the same service code the UI
 * uses. A policy can pass a SQL suite and still be unreachable from the app, and an app can
 * type-check and still send a column the database rejects. Only a real round trip finds
 * both.
 *
 * Everything here is created inside the run and removed again before it finishes. Each
 * fixture carries a `zz-live-probe` marker so cleanup can find an orphan left behind by a
 * test that failed halfway through, and `afterAll` runs that cleanup unconditionally.
 *
 * Run deliberately, never as part of `npm test`:
 *
 *   VITE_RUN_LIVE_TESTS=1 \
 *   VITE_LIVE_ADMIN_EMAIL=... VITE_LIVE_ADMIN_PASSWORD=... npm run test:live
 *
 * The password is supplied for the run only and is never read from a committed file.
 */

const live = import.meta.env.VITE_RUN_LIVE_TESTS === '1'
const adminEmail = import.meta.env.VITE_LIVE_ADMIN_EMAIL as string | undefined
const adminPassword = import.meta.env.VITE_LIVE_ADMIN_PASSWORD as string | undefined

/** Unique per run, so two runs cannot collide and cleanup cannot match a stale row. */
const RUN = Date.now().toString(36)
const MARKER = 'zz-live-probe'
const PROBE_SLUG = `${MARKER}-${RUN}`
const PROBE_SUBJECT = `${MARKER} ${RUN}`
const PROBE_FILE = `${MARKER}.png`

const TIMEOUT = 30_000

/** A 1x1 PNG. The only requirement is a real, decodable image with a non-zero size. */
function probeImage(): File {
  const bytes = Uint8Array.from(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    ),
    (character) => character.charCodeAt(0),
  )

  // vitest runs in jsdom, whose `File` is a record that Node's fetch (the one supabase-js
  // ends up calling in a test process) cannot use as a body. `node:buffer`'s File is the
  // one undici accepts. In a real browser this path is exercised with the native File, so
  // only the test process needs the swap.
  return new NativeFile([bytes], PROBE_FILE, { type: 'image/png' }) as unknown as File
}

describe.skipIf(!live || !adminEmail || !adminPassword)('live admin writes', () => {
  let credentials: { email: string; password: string }
  let asset: MediaAsset
  let projectId: string
  let technologyId: string

  beforeAll(async () => {
    if (!adminEmail || !adminPassword) {
      throw new Error('Set VITE_LIVE_ADMIN_EMAIL and VITE_LIVE_ADMIN_PASSWORD to run this test.')
    }

    credentials = { email: adminEmail, password: adminPassword }

    const { error } = await getSupabaseClient().auth.signInWithPassword(credentials)
    if (error) throw new Error(`Could not sign in as the live admin: ${error.message}`)
  }, TIMEOUT)

  /** Removes one kind of leftover without letting it hide the others. */
  async function attempt(label: string, cleanup: () => Promise<void>): Promise<void> {
    try {
      await cleanup()
    } catch (error) {
      console.warn(`[live-admin-crud] could not clean up ${label}`, error)
    }
  }

  afterAll(async () => {
    // Runs whether the suite passed or aborted mid-way. A failed assertion must never
    // leave a probe row or a stray file in the owner's project.
    await attempt('projects', async () => {
      const rows = await getAllProjects()
      for (const row of rows.filter((item) => item.slug.startsWith(MARKER))) {
        await deleteProject(row.id)
      }
    })

    await attempt('media', async () => {
      const rows = await getMediaAssets()
      for (const row of rows.filter((item) => item.fileName === PROBE_FILE)) {
        await deleteMediaAsset(row)
      }
    })

    await attempt('messages', async () => {
      const rows = await getContactMessages('inbox')
      for (const row of rows.filter((item) => item.subject === PROBE_SUBJECT)) {
        await deleteContactMessage(row.id)
      }
    })

    await getSupabaseClient().auth.signOut().catch(() => undefined)
  }, TIMEOUT)

  it(
    'uploads an image, records it, and reports nothing as referencing it yet',
    async () => {
      asset = await uploadMedia({
        file: probeImage(),
        folder: STORAGE_FOLDERS.misc,
        altText: 'Probe image',
      })

      expect(asset.bucket).toBe(STORAGE_BUCKETS.media)
      expect(asset.path.startsWith(`${STORAGE_FOLDERS.misc}/`)).toBe(true)

      const library = await getMediaAssets()
      expect(library.some((row) => row.id === asset.id)).toBe(true)

      // Nothing points at the file yet, so the map must have no key for it. An absent key
      // and an empty list both read as "unused", but only an absent key is what the
      // library's unused filter is built on.
      const usage = await getMediaUsage()
      expect(usage.has(`${asset.bucket}::${asset.path}`)).toBe(false)

      // The file *is* recorded in `media`, so the unrecorded-object scan must not offer to
      // delete it. This is the exclusion that protects a recorded file from the cleanup.
      const unrecorded = await getUnrecordedObjects()
      expect(unrecorded.some((object) => object.path === asset.path)).toBe(false)
    },
    TIMEOUT,
  )

  it(
    'creates a draft project with a technology and a gallery image',
    async () => {
      const technology = (await getTechnologies())[0]
      expect(technology, 'the database must hold at least one technology').toBeDefined()
      technologyId = technology!.id

      const values: ProjectValues = {
        title: 'Live Probe Project',
        slug: PROBE_SLUG,
        summary: 'A project created by the live admin test.',
        coverImagePath: '',
        repositoryUrl: '',
        liveUrl: '',
        role: 'Probe',
        clientName: '',
        startedAt: '2024-01-01',
        endedAt: '',
        isFeatured: false,
        isPublished: false,
        sortOrder: 9999,
        technologyIds: [technologyId],
        gallery: [{ path: asset.path, altText: 'Probe gallery image' }],
      }

      const created = await createProject(values)
      projectId = created.id

      expect(created.slug).toBe(PROBE_SLUG)
      expect(created.isPublished).toBe(false)

      // The relations come back resolved and camelCased. This is the assertion that would
      // have caught the class of bug this project was built around: a snake_case key that
      // type-checks and resolves to `undefined` in the UI.
      const probe = (await getAllProjects()).find((row) => row.id === projectId)
      expect(probe, 'the admin table shows drafts').toBeDefined()
      expect(probe?.technologies.map((item) => item.id)).toEqual([technologyId])
      expect(probe?.images).toHaveLength(1)
      expect(probe?.images[0]?.altText).toBe('Probe gallery image')
    },
    TIMEOUT,
  )

  it(
    'keeps the draft and the inbox away from a signed-out visitor',
    async () => {
      const supabase = getSupabaseClient()

      // The re-sign-in happens in `finally` so that a failed assertion still leaves the
      // session restored for the tests that follow; the failure itself is reported after
      // the block rather than thrown from inside it, where it would swallow the assertion
      // error that caused the `finally` to run.
      let reSignInError: string | null = null

      try {
        await supabase.auth.signOut()

        const publicList = await getAllProjects()
        expect(publicList.some((row) => row.id === projectId)).toBe(false)
        expect(await getProjectBySlug(PROBE_SLUG)).toBeNull()

        // anon holds no SELECT grant on contact_messages at all, so the inbox must be
        // refused outright rather than returned empty. Returning rows here would mean the
        // grant, not just the policy, had been widened.
        await expect(getContactMessages('inbox')).rejects.toThrow()

        // The one write the public is allowed to make.
        await submitContactMessage({
          name: 'Live Probe',
          email: 'probe@example.com',
          subject: PROBE_SUBJECT,
          message: 'Submitted by the live admin test.',
        })
      } finally {
        const { error } = await supabase.auth.signInWithPassword(credentials)
        reSignInError = error?.message ?? null
      }

      if (reSignInError) {
        throw new Error(`Could not re-sign-in after the anon window: ${reSignInError}`)
      }
    },
    TIMEOUT,
  )

  it(
    'lets the admin find, triage, and delete the submitted message',
    async () => {
      const message = (await getContactMessages('inbox')).find(
        (row) => row.subject === PROBE_SUBJECT,
      )
      expect(message, 'the anon submission must reach the admin inbox').toBeDefined()

      const updated = await updateContactMessage(message!.id, {
        isRead: true,
        isArchived: false,
      })
      expect(updated.isRead).toBe(true)
      expect(updated.name).toBe('Live Probe')

      await deleteContactMessage(message!.id)

      const afterDelete = await getContactMessages('inbox')
      expect(afterDelete.some((row) => row.id === message!.id)).toBe(false)
    },
    TIMEOUT,
  )

  it(
    'publishes the project and reports the image as used by it',
    async () => {
      const published = await updateProject(projectId, {
        title: 'Live Probe Project',
        slug: PROBE_SLUG,
        summary: 'A project created by the live admin test.',
        coverImagePath: '',
        repositoryUrl: '',
        liveUrl: '',
        role: 'Probe',
        clientName: '',
        startedAt: '2024-01-01',
        endedAt: '',
        isFeatured: true,
        isPublished: true,
        sortOrder: 9999,
        technologyIds: [technologyId],
        gallery: [{ path: asset.path, altText: 'Probe gallery image' }],
      } satisfies ProjectValues)

      expect(published.isPublished).toBe(true)

      const publicView = await getProjectBySlug(PROBE_SLUG)
      expect(publicView, 'a published project is reachable by its slug').not.toBeNull()
      expect(publicView?.images).toHaveLength(1)

      // The library's whole purpose: the file now has a named owner to show before it is
      // offered for deletion.
      const references = await getMediaUsage().then((usage) =>
        usage.get(`${asset.bucket}::${asset.path}`),
      )
      expect(references, 'the gallery entry must be reported as a reference').toBeDefined()
      expect(references?.[0]?.label).toContain('Live Probe Project')
    },
    TIMEOUT,
  )

  it(
    'removes a dropped technology and a dropped gallery image on save',
    async () => {
      await updateProject(projectId, {
        title: 'Live Probe Project',
        slug: PROBE_SLUG,
        summary: 'A project created by the live admin test.',
        coverImagePath: '',
        repositoryUrl: '',
        liveUrl: '',
        role: 'Probe',
        clientName: '',
        startedAt: '2024-01-01',
        endedAt: '',
        isFeatured: false,
        isPublished: true,
        sortOrder: 9999,
        technologyIds: [],
        gallery: [],
      } satisfies ProjectValues)

      const publicView = await getProjectBySlug(PROBE_SLUG)
      expect(publicView?.technologies).toHaveLength(0)
      expect(publicView?.images).toHaveLength(0)

      const usage = await getMediaUsage()
      expect(usage.has(`${asset.bucket}::${asset.path}`)).toBe(false)
    },
    TIMEOUT,
  )

  it(
    'deletes the project and the uploaded file completely',
    async () => {
      await deleteProject(projectId)

      expect((await getAllProjects()).some((row) => row.id === projectId)).toBe(false)
      expect(await getProjectBySlug(PROBE_SLUG)).toBeNull()

      await deleteMediaAsset(asset)

      expect((await getMediaAssets()).some((row) => row.id === asset.id)).toBe(false)

      // The row going first would be enough for the library, but a file left in the bucket
      // is invisible everywhere and would outlive the test.
      const [folder, fileName] = asset.path.split('/')
      const { data } = await getSupabaseClient()
        .storage.from(STORAGE_BUCKETS.media)
        .list(folder ?? '', { search: fileName })

      expect((data ?? []).some((object) => object.name === fileName)).toBe(false)
    },
    TIMEOUT,
  )
})
