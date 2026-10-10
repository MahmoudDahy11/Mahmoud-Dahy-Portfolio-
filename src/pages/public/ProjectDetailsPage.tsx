import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CodeXml } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { DestinationButton, LinkButton } from '@/components/ui/link-button'
import { ErrorState } from '@/components/common/ErrorState'
import { ImageLightbox, type LightboxImage } from '@/components/common/ImageLightbox'
import { SkeletonList } from '@/components/common/LoadingState'
import { useProject } from '@/features/projects'
import { usePageSeo } from '@/hooks/useSeo'
import { PUBLIC_ROUTES } from '@/constants/routes'
import { imageUrl } from '@/services/mediaUrls'
import { formatDateRange } from '@/utils/formatDate'

/** Cover image, with the gallery as a secondary set. */
function ProjectImages({
  coverImagePath,
  images,
  title,
}: {
  coverImagePath: string | null
  images: { id: string; path: string; altText: string | null; sortOrder: number }[]
  title: string
}) {
  const cover = imageUrl(coverImagePath)
  const gallery = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const lightboxImages = useMemo<LightboxImage[]>(() => {
    const previewImages: LightboxImage[] = []

    if (cover) {
      previewImages.push({
        src: cover,
        alt: `${title} cover`,
        label: `${title} cover`,
      })
    }

    gallery.forEach((image, index) => {
      const src = imageUrl(image.path)
      if (!src) return

      const label = image.altText?.trim() || `${title} gallery image ${index + 1}`

      previewImages.push({
        src,
        alt: image.altText ?? '',
        label,
      })
    })

    return previewImages
  }, [cover, gallery, title])

  return (
    <div className="space-y-4">
      {cover ? (
        <button
          type="button"
          className="group block w-full rounded-lg text-left focus-visible:outline-ring"
          onClick={() => setPreviewIndex(0)}
          aria-label={`Preview ${title} cover`}
        >
          <img
            src={cover}
            alt={`${title} cover`}
            className="border-border w-full rounded-lg border object-cover transition duration-(--motion-duration) group-hover:brightness-95"
          />
        </button>
      ) : null}

      {/*
        Gallery images carry the alt text the owner wrote, when they have one; without it
        the image is rendered with an empty alt, which marks it decorative. The cover above
        is decorative repetition of the page title, so it is described by its own name
        rather than repeating the summary.
      */}
      {gallery.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {gallery.map((image, index) => {
            const src = imageUrl(image.path)
            if (!src) return null

            const previewIndexForImage = cover ? index + 1 : index

            return (
              <button
                key={image.id}
                type="button"
                className="group block rounded-lg text-left focus-visible:outline-ring"
                onClick={() => setPreviewIndex(previewIndexForImage)}
                aria-label={`Preview ${image.altText?.trim() || `${title} gallery image ${index + 1}`}`}
              >
                <img
                  src={src}
                  alt={image.altText ?? ''}
                  className="border-border w-full rounded-lg border object-cover transition duration-(--motion-duration) group-hover:brightness-95"
                  loading="lazy"
                />
              </button>
            )
          })}
        </div>
      ) : null}

      <ImageLightbox
        images={lightboxImages}
        currentIndex={previewIndex}
        onChange={setPreviewIndex}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  )
}

/** One project, addressed by slug. */
export default function ProjectDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = useProject(slug)

  // The project title is the useful part of this tab, so the site name is appended only
  // once the record has loaded.
  const siteUrl = import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173'

  /*
    Breadcrumb structured data. The "All projects" link at the top of the page is the
    visual breadcrumb; this gives search engines the same path in machine-readable form.
  */
  const breadcrumbJsonLd = useMemo(() => {
    if (!project.data) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: `${siteUrl}/projects` },
        {
          '@type': 'ListItem',
          position: 3,
          name: project.data.title,
          item: `${siteUrl}/projects/${encodeURIComponent(project.data.slug)}`,
        },
      ],
    }
  }, [project.data, siteUrl])

  usePageSeo({
    section: project.data ? project.data.title : 'Project',
    description: project.data?.summary ?? 'Project details.',
    image: imageUrl(project.data?.coverImagePath) ?? undefined,
    type: 'article',
    jsonLd: breadcrumbJsonLd,
  })

  if (project.isLoading) {
    return (
      <div className="container-page py-16">
        <SkeletonList rows={3} />
      </div>
    )
  }

  if (project.isError) {
    return (
      <div className="container-page py-16">
        <ErrorState
          message="This project could not be loaded. It may have been unpublished."
          onRetry={() => void project.refetch()}
        />
      </div>
    )
  }

  /*
   * A missing project and an unpublished one are deliberately indistinguishable. The
   * database hides drafts from the public, so this page cannot tell them apart either,
   * and pretending otherwise would confirm the existence of a draft to anyone guessing
   * slugs.
   */
  if (!project.data) {
    return (
      <div className="container-page py-16">
        <ErrorState message="That project could not be found." />
        <div className="mt-6">
          <LinkButton to={PUBLIC_ROUTES.projects} variant="outline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to all projects
          </LinkButton>
        </div>
      </div>
    )
  }

  const data = project.data
  const technologies = [...data.technologies].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )

  const dates = formatDateRange(data.startedAt, data.endedAt)

  return (
    <article className="container-page py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <LinkButton to={PUBLIC_ROUTES.projects} variant="ghost" size="sm" className="-ml-3">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All projects
          </LinkButton>

          <header className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{data.title}</h1>

            {data.summary ? <p className="text-muted-foreground text-lg">{data.summary}</p> : null}

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {data.role ? <span>{data.role}</span> : null}
              {data.clientName ? <span>{data.clientName}</span> : null}
              {dates ? <span>{dates}</span> : null}
            </div>
          </header>
        </div>

        <ProjectImages
          coverImagePath={data.coverImagePath}
          images={data.images}
          title={data.title}
        />

        {technologies.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Built with</h2>
            <ul className="flex flex-wrap gap-2">
              {technologies.map((technology) => (
                <li key={technology.id}>
                  <Badge variant="secondary">{technology.name}</Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.description ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Overview</h2>
            {/*
              `whitespace-pre-line` rather than `dangerouslySetInnerHTML`. The database has no
              HTML column, so the owner cannot store a script through this path, and rendering
              text keeps it that way without needing a sanitiser.
            */}
            <p className="whitespace-pre-line">{data.description}</p>
          </section>
        ) : null}

        {data.repositoryUrl || data.liveUrl ? (
          <section className="flex flex-wrap gap-3 border-t pt-6">
            {data.repositoryUrl ? (
              <DestinationButton to={data.repositoryUrl} variant="outline">
                <CodeXml className="size-4" aria-hidden="true" />
                View source
              </DestinationButton>
            ) : null}

            {data.liveUrl ? (
              <DestinationButton to={data.liveUrl}>
                <ArrowUpRight className="size-4" aria-hidden="true" />
                Live demo
              </DestinationButton>
            ) : null}
          </section>
        ) : null}
      </div>
    </article>
  )
}
