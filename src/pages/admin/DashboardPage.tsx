import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { FullPageSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { queryKeys } from '@/lib/queryKeys'
import { getAdminOverview, type ContentCounts } from '@/services/adminOverview'
import { ADMIN_ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatDate'
import { cn } from '@/lib/utils'

/** A single section's numbers, linking to the page that edits it. */
type SectionCardProps = {
  title: string
  to: string
  counts: ContentCounts
  /** Shown when the section has no publish flag and only has a total. */
  totalOnly?: boolean
}

function SectionCard({ title, to, counts, totalOnly = false }: SectionCardProps) {
  return (
    <Card className="relative transition-colors hover:border-ring/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <Link
            to={to}
            className="after:absolute after:inset-0 focus-visible:underline focus-visible:outline-none"
          >
            {title}
          </Link>
        </CardTitle>
        {totalOnly ? null : (
          <CardDescription>
            {counts.published} published
            {counts.drafts > 0 ? ` · ${counts.drafts} draft${counts.drafts === 1 ? '' : 's'}` : ''}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{counts.total}</span>
        <span className="text-muted-foreground text-sm">
          {totalOnly ? (counts.total === 1 ? 'entry' : 'entries') : 'total'}
        </span>
        {counts.drafts > 0 && !totalOnly ? (
          <Badge variant="outline" className="ml-auto">
            Drafts
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )
}

/**
 * The admin dashboard.
 *
 * Read-only, and deliberately so: it answers "what needs my attention" rather than being a
 * second place to edit things. Unread messages and drafts are the two things a section
 * author actually wants to know about on opening the dashboard, so those are what the
 * counts lead with and every card links to the page that fixes them.
 *
 * Each figure is counted by the database. See `adminOverview.ts` for why.
 */
export default function DashboardPage() {
  const overview = useQuery({
    queryKey: queryKeys.adminOverview(),
    queryFn: getAdminOverview,
  })

  if (overview.isPending) {
    return <FullPageSpinner label="Loading your dashboard…" />
  }

  if (overview.error) {
    return <ErrorState message="Could not load the dashboard." onRetry={() => void overview.refetch()} />
  }

  const { counts, totals, messages, recent } = overview.data

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your content, and anything waiting for you."
      />

      <div className="space-y-8">
        {/*
          Messages first, and prominently: a new enquiry is the only item on this page with a
          deadline attached to it. Everything else is inventory.
        */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Messages</CardTitle>
            <CardDescription>
              {messages.unread > 0
                ? `${messages.unread} unread`
                : 'Nothing unread. The inbox is clear.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No messages yet. Submissions from the contact form will appear here.
              </p>
            ) : (
              <ul className="divide-y">
                {recent.map((message) => (
                  <li key={message.id} className="flex items-start gap-3 py-3 first:pt-0">
                    <Mail
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        message.isRead ? 'text-muted-foreground' : 'text-primary',
                      )}
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm', !message.isRead && 'font-medium')}>
                        {message.subject?.trim() || message.name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {message.name} · {formatDate(message.createdAt, { dateStyle: 'medium' })}
                      </p>
                    </div>

                    {message.isRead ? null : (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        New
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <Button variant="outline" size="sm" render={<Link to={ADMIN_ROUTES.messages} />}>
              Open inbox
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>

        <section aria-labelledby="content-heading" className="space-y-4">
          <h2 id="content-heading" className="text-lg font-semibold">
            Content
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SectionCard title="Projects" to={ADMIN_ROUTES.projects} counts={counts.projects} />
            <SectionCard title="Skills" to={ADMIN_ROUTES.skills} counts={counts.skills} />
            <SectionCard
              title="Technologies"
              to={ADMIN_ROUTES.skills}
              counts={{ total: totals.technologies, published: totals.technologies, drafts: 0 }}
              totalOnly
            />
            <SectionCard
              title="Skill categories"
              to={ADMIN_ROUTES.skills}
              counts={{ total: totals.skillCategories, published: totals.skillCategories, drafts: 0 }}
              totalOnly
            />
            <SectionCard
              title="Experience"
              to={ADMIN_ROUTES.experience}
              counts={counts.experiences}
            />
            <SectionCard
              title="Education"
              to={ADMIN_ROUTES.education}
              counts={counts.education}
            />
            <SectionCard
              title="Certificates"
              to={ADMIN_ROUTES.certificates}
              counts={counts.certificates}
            />
            <SectionCard
              title="About sections"
              to={ADMIN_ROUTES.about}
              counts={counts.aboutSections}
            />
            <SectionCard title="Services" to={ADMIN_ROUTES.services} counts={counts.services} />
            <SectionCard
              title="Social links"
              to={ADMIN_ROUTES.socialLinks}
              counts={counts.socialLinks}
            />
            <SectionCard
              title="Media files"
              to={ADMIN_ROUTES.media}
              counts={{ total: totals.media, published: totals.media, drafts: 0 }}
              totalOnly
            />
          </div>
        </section>
      </div>
    </>
  )
}
