import { useState } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Mail, MailOpen } from 'lucide-react'
import { MessageDialog } from '@/features/messages/MessageDialog'
import { useContactMessages, useMessageCounts, useMessageMutations } from '@/features/messages/hooks'
import type { MessageFilter } from '@/services/contactMessages'
import { formatDate } from '@/utils/formatDate'
import { cn } from '@/lib/utils'
import type { ContactMessage } from '@/types/entities'

const FILTERS: { value: MessageFilter; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'unread', label: 'Unread' },
  { value: 'archived', label: 'Archived' },
]

/** The badge next to a filter label, shown only when there is something to count. */
function CountBadge({ count, value }: { count: number | undefined; value: MessageFilter }) {
  if (count === undefined || count === 0) return null

  return (
    <Badge variant={value === 'unread' ? 'default' : 'secondary'} className="ml-1 tabular-nums">
      {count}
    </Badge>
  )
}

/**
 * The contact inbox.
 *
 * Reads and triages; it never edits a message. The row click opens the read-only detail
 * dialog, and every triage action is a button there rather than a row action, because
 * "mark unread" has no sensible one-click form in a table.
 *
 * The unread count is a separate query from the list so the badge is correct the moment a
 * message is marked read, rather than being derived from whichever view happens to be open.
 */
export default function MessagesPage() {
  const [filter, setFilter] = useState<MessageFilter>('inbox')
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null)

  const messages = useContactMessages(filter)
  const counts = useMessageCounts()
  const { triage, remove, isPending } = useMessageMutations()

  const columns: Column<ContactMessage>[] = [
    {
      id: 'from',
      header: 'From',
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          {row.original.isRead ? (
            <MailOpen className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Mail className="size-4 shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className={cn('truncate', !row.original.isRead && 'font-semibold')}>
              {row.original.name}
            </p>
            <p className="text-muted-foreground truncate text-xs">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'subject',
      header: 'Message',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate">
            {row.original.subject?.trim() || <span className="text-muted-foreground italic">No subject</span>}
          </p>
          <p className="text-muted-foreground line-clamp-1 text-xs">{row.original.message}</p>
        </div>
      ),
    },
    {
      id: 'received',
      header: 'Received',
      cell: ({ row }) => (
        <time
          dateTime={row.original.createdAt}
          className="text-muted-foreground text-sm whitespace-nowrap"
        >
          {formatDate(row.original.createdAt, { dateStyle: 'medium' })}
        </time>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <RowActions
          recordName={`the message from ${row.original.name}`}
          // The row itself opens the message; the menu offers only what is safe from a table.
          onEdit={() => setSelected(row.original)}
          onDelete={() => setPendingDelete(row.original)}
          isPending={isPending}
          editLabel="Open"
          editIcon={MailOpen}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Messages" description="Submissions from the contact form." />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as MessageFilter)}>
        <TabsList>
          {FILTERS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              <CountBadge count={counts.data?.[value]} value={value} />
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="pt-4">
          <DataTable
            columns={columns}
            data={messages.data ?? []}
            getRowId={(row) => row.id}
            caption="contact messages"
            isLoading={messages.isPending}
            error={messages.error}
            onRetry={() => void messages.refetch()}
            emptyTitle={filter === 'archived' ? 'Nothing archived' : 'No messages yet'}
            emptyDescription={
              filter === 'unread'
                ? 'Every message has been read.'
                : filter === 'archived'
                  ? 'Archived messages are kept here rather than deleted, so nothing is lost by mistake.'
                  : 'Messages from the contact form will appear here.'
            }
            hideBelow={{ received: 'md' }}
          />
        </TabsContent>
      </Tabs>

      <MessageDialog
        message={selected}
        isPending={isPending}
        onClose={() => setSelected(null)}
        onToggleRead={(message) => triage.mutate({ id: message.id, isRead: !message.isRead })}
        onToggleArchive={(message) =>
          triage.mutate({ id: message.id, isArchived: !message.isArchived })
        }
        onDelete={(message) => {
          // Close the detail dialog first: the confirm dialog replaces it, and leaving both
          // mounted would put two modals in the accessibility tree at once.
          setSelected(null)
          setPendingDelete(message)
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete the message from ${pendingDelete?.name ?? 'this sender'}?`}
        description="This cannot be undone. Archiving keeps the message instead, if you only want it out of the inbox."
        confirmLabel="Delete message"
        destructive
        isPending={isPending}
        onConfirm={async () => {
          if (!pendingDelete) return

          await remove.mutateAsync(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </>
  )
}
