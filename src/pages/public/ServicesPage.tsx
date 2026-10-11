import { ArrowRight, Palette } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { LinkButton } from '@/components/ui/link-button'
import { PUBLIC_ROUTES } from '@/constants/routes'
import { useServices } from '@/features/services'
import { usePageSeo } from '@/hooks/useSeo'
import { imageUrl } from '@/services/mediaUrls'

/** Published services, in owner-defined order. */
export default function ServicesPage() {
  const services = useServices()

  usePageSeo({
    section: 'Services',
    description: 'What I can help with, and how to start.',
  })

  return (
    <Section>
      <Container>
        <SectionHeading
          title="Services"
          description="What I can help with. If what you need is not listed, get in touch and ask."
          headingLevel="h1"
        />

        <QueryState
          isLoading={services.isLoading}
          isError={services.isError}
          error={services.error}
          data={services.data}
          skeletonRows={3}
          emptyTitle="No services listed yet"
          emptyDescription="Services will appear here once they are published."
          emptyIcon={Palette}
          onRetry={() => void services.refetch()}
        >
          {(data) => (
            <div className="border-t border-border">
              {data.map((service, index) => (
                <article
                  key={service.id}
                  className="grid gap-4 border-b border-border py-7 sm:grid-cols-[2rem_1fr] sm:gap-6"
                >
                  <span
                    aria-hidden="true"
                    className="font-display hidden text-lg text-muted-foreground sm:block"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {service.iconPath ? (
                        <img
                          src={imageUrl(service.iconPath) ?? undefined}
                          alt=""
                          className="size-8 shrink-0 object-contain"
                          loading="lazy"
                        />
                      ) : null}

                      <h2 className="text-lg font-semibold tracking-tight">
                        {service.title}
                      </h2>
                    </div>

                    {service.priceHint ? (
                      <p className="text-sm font-medium text-primary">{service.priceHint}</p>
                    ) : null}

                    <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed whitespace-pre-line">
                      {service.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </QueryState>

        <div className="mt-12">
          <LinkButton to={PUBLIC_ROUTES.contact}>
            Discuss a project
            <ArrowRight className="size-4" aria-hidden="true" />
          </LinkButton>
        </div>
      </Container>
    </Section>
  )
}
