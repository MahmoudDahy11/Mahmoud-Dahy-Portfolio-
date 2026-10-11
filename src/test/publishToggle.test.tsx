import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectDialog } from '@/features/projects/ProjectDialog'
import type { ProjectValues } from '@/schemas/project'
import type { ProjectWithRelations } from '@/types/entities'

const project: ProjectWithRelations = {
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
  isPublished: false,
  sortOrder: 0,
  field: 'software',
  createdAt: '2026-10-06T14:41:38Z',
  updatedAt: '2026-10-06T14:41:38Z',
  technologies: [],
  images: [],
} as unknown as ProjectWithRelations

describe('publish switch in the project dialog', () => {
  it('submits isPublished: true after the switch is turned on', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async (_values: ProjectValues) => {})

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

    const published = screen.getByLabelText(/published/i) as HTMLInputElement
    expect(published.checked).toBe(false)

    await user.click(published)
    expect(published.checked).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ isPublished: true })
  })
})
