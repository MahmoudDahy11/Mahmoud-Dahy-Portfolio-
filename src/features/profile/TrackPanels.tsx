import { ArrowRight, PlugZap, Smartphone } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { LinkButton } from '@/components/ui/link-button'
import { FIELD_LABELS } from '@/constants/fields'
import { PUBLIC_ROUTES } from '@/constants/routes'

/**
 * The two professional tracks side by side on the home page.
 *
 * Both panels lead to the projects page, where the existing field filter focuses the
 * list on one track. No filtering logic lives here — this strip only states the two
 * identities and points at the page that already separates them.
 */
export function TrackPanels() {
  return (
    <Section className="border-b">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-0">
          <div className="space-y-3 sm:border-r sm:border-border sm:pr-10">
            <div className="flex items-center gap-3">
              <Smartphone className="size-5 text-primary" aria-hidden="true" />
              <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                {FIELD_LABELS.software}
              </p>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Flutter &amp; Software Development
            </h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Mobile and software work — apps, tools, and builds, each presented with its
              stack, source, and live result.
            </p>
            <LinkButton to={PUBLIC_ROUTES.projects} variant="link" className="px-0">
              View {FIELD_LABELS.software} projects
              <ArrowRight className="size-4" aria-hidden="true" />
            </LinkButton>
          </div>

          <div className="space-y-3 border-t border-border pt-10 sm:border-t-0 sm:pt-0 sm:pl-10">
            <div className="flex items-center gap-3">
              <PlugZap className="size-5 text-primary" aria-hidden="true" />
              <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                {FIELD_LABELS.elv}
              </p>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              ELV / Light Current Engineering
            </h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Light-current systems and engineering background — training, certificates,
              and hands-on work, published as it is completed.
            </p>
            <LinkButton to={PUBLIC_ROUTES.projects} variant="link" className="px-0">
              View {FIELD_LABELS.elv} projects
              <ArrowRight className="size-4" aria-hidden="true" />
            </LinkButton>
          </div>
        </div>
      </Container>
    </Section>
  )
}
