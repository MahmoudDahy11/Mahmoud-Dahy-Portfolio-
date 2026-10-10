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
            <div className="grid gap-6 sm:grid-cols-2">
              {data.map((service) => (
                <article key={service.id} className="border-border flex flex-col gap-3 rounded-lg border p-6">
                  <div className="flex items-start gap-3">
                    {service.iconPath ? (
                      <img
                        src={imageUrl(service.iconPath) ?? undefined}
                        alt=""
                        className="size-10 shrink-0 object-contain"
                        loading="lazy"
                      />
                    ) : null}

                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold tracking-tight">{service.title}</h2>
                      {service.priceHint ? (
                        <p className="text-muted-foreground text-sm">{service.priceHint}</p>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm whitespace-pre-line">{service.description}</p>
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
