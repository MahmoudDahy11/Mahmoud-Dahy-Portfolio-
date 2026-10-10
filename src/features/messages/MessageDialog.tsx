import { Archive, ArchiveRestore, Mail, MailOpen, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/formatDate'
import type { ContactMessage } from '@/types/entities'

type MessageDialogProps = {
  message: ContactMessage | null
  isPending: boolean
  onClose: () => void
  onToggleRead: (message: ContactMessage) => void
  onToggleArchive: (message: ContactMessage) => void
  onDelete: (message: ContactMessage) => void
}

/**
 * One message, read-only, with the triage actions.
 *
 * There is no edit form here on purpose. The text is what a visitor wrote, and letting the
 * owner rewrite it would make the inbox stop being a record of what was received. The one
 * thing worth doing with a message is replying to it, which the `mailto:` button does.
 *
 * The sender's address and the message body are rendered as text, never as markup, so
 * nothing from a stranger can inject HTML into the admin dashboard.
 */
export function MessageDialog({
  message,
  isPending,
  onClose,
  onToggleRead,
  onToggleArchive,
  onDelete,
}: MessageDialogProps) {
  return (
    <Dialog open={message !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{message?.subject?.trim() || 'No subject'}</DialogTitle>
          <DialogDescription>
            {message ? (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-foreground">{message.name}</span>
                <span>&lt;{message.email}&gt;</span>
                <span aria-hidden="true">·</span>
                <time dateTime={message.createdAt}>{formatDate(message.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</time>
                {message.isRead ? null : <Badge variant="secondary">Unread</Badge>}
                {message.isArchived ? <Badge variant="outline">Archived</Badge> : null}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {/*
          `whitespace-pre-wrap` rather than a <p> per line: a visitor's own line breaks are
          part of what they wrote, so they are preserved rather than reflowed.
        */}
        <div className="max-h-[min(60vh,30rem)] overflow-y-auto">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message?.message}</p>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => message && onDelete(message)}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>

          <div className="flex flex-wrap gap-2">
            {message ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                render={<a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject?.trim() || 'your message'}`)}`} />}
              >
                <Mail aria-hidden="true" />
                Reply
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !message}
              onClick={() => message && onToggleRead(message)}
            >
              {message?.isRead ? <Mail aria-hidden="true" /> : <MailOpen aria-hidden="true" />}
              {message?.isRead ? 'Mark unread' : 'Mark read'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !message}
              onClick={() => message && onToggleArchive(message)}
            >
              {message?.isArchived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
              {message?.isArchived ? 'Unarchive' : 'Archive'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
