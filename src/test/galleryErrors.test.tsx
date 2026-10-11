import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectDialog } from '@/features/projects/ProjectDialog'
import type { ProjectValues } from '@/schemas/project'
import type { ProjectWithRelations } from '@/types/entities'

/** Only the columns the form reads; the stored row carries more, and alt text may be NULL. */
type ImageInput = { id: string; path: string; altText: string | null }

function buildProject(images: ImageInput[]): ProjectWithRelations {
  return {
    id: 'p1',
    title: 'Factory Management System',
    slug: 'factory-management-system',
    summary: 'A factory management system.',
    description: null,
    coverImagePath: null,
    repositoryUrl: null,
    liveUrl: null,
    role: null,
    clientName: null,
    startedAt: null,
    endedAt: null,
    isFeatured: false,
    isPublished: true,
    sortOrder: 0,
    field: 'software',
    createdAt: '2026-10-06T14:41:38Z',
    updatedAt: '2026-10-06T14:41:38Z',
    technologies: [],
    images: images as unknown as ProjectWithRelations['images'],
  } as unknown as ProjectWithRelations
}

function renderDialog(project: ProjectWithRelations, onSubmit: (values: ProjectValues) => void) {
  render(
    <ProjectDialog
      open
      onOpenChange={() => {}}
      project={project}
      technologies={[]}
      isSubmitting={false}
      onSubmit={onSubmit}
    />,
  )
}

/**
 * A gallery row with no file is rejected by the schema, and the gallery is the only part
 * of the form that does not render its own errors — so before these messages existed,
 * "Save changes" simply did nothing and said nothing. The description is not one of the
 * rules: an image with no alt text saves, and is stored with a NULL description.
 */
describe('project dialog gallery validation', () => {
  it('explains a rejected save when an image row has no file', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async (_values: ProjectValues) => {})

    renderDialog(buildProject([]), onSubmit)

    await user.click(screen.getByRole('button', { name: 'Add gallery image' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('An image is required.')).toBeInTheDocument()
    expect(document.activeElement).toHaveAttribute('id', 'gallery-image-0')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('saves an image whose alt text was left blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async (_values: ProjectValues) => {})

    renderDialog(buildProject([{ id: 'i1', path: 'projects/dashboard.png', altText: null }]), onSubmit)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]?.[0].gallery).toEqual([
      { path: 'projects/dashboard.png', altText: '' },
    ])
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })

  it('saves an image with alt text', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async (_values: ProjectValues) => {})

    renderDialog(buildProject([{ id: 'i1', path: 'projects/dashboard.png', altText: 'Dashboard' }]), onSubmit)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })
})
