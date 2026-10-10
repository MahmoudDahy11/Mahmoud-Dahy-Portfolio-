import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TextAreaField, TextField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { useSubmitContactMessage } from './hooks'
import { contactSchema, type ContactValues } from '@/schemas'
import { toErrorMessage } from '@/lib/errors'

/**
 * The public contact form.
 *
 * It owns the React Hook Form instance, the validation, and the submit handler. The
 * request itself lives in the feature's hook, so this file contains no Supabase calls.
 *
 * Three things the visitor needs, all handled here: a disabled button while sending, a
 * readable failure message if the send fails, and a clear confirmation on success. Nothing
 * fails silently.
 */
export function ContactForm() {
  const sendMessage = useSubmitContactMessage()

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '', website: '' },
  })

  async function onSubmit(values: ContactValues) {
    // A human never sees the honeypot field, so a value here means a bot filled in every
    // input it found. Pretending the send worked and returning quietly is the point: a bot
    // that gets an error learns to adapt, while a person who somehow filled the field is
    // not handed a technical explanation.
    if (values.website) {
      form.reset()
      return
    }

    try {
      await sendMessage.mutateAsync({
        name: values.name,
        email: values.email,
        subject: values.subject || null,
        message: values.message,
      })

      // Only cleared on success. A failed send keeps the text so a long message is never
      // lost to a dropped connection.
      form.reset()
      toast.success('Message sent. Thank you for getting in touch.')
    } catch (error) {
      toast.error(toErrorMessage(error, 'Your message could not be sent. Please try again.'))
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <TextField name="name" label="Name" required autoComplete="name" />
        <TextField name="email" label="Email" type="email" required autoComplete="email" />
        <TextField name="subject" label="Subject" autoComplete="off" />
        <TextAreaField name="message" label="Message" required rows={6} />

        {/*
          Honeypot. Hidden from people, visible to bots that fill every input. The submit
          handler discards the submission when this has a value. It is `position: absolute`
          rather than `display: none` so assistive technology does not announce it, and
          `aria-hidden` plus `tabIndex={-1}` keep it out of reach either way.
        */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...form.register('website')} />
        </div>

        <Button type="submit" disabled={sendMessage.isPending}>
          {sendMessage.isPending ? 'Sending…' : 'Send message'}
        </Button>
      </form>
    </FormProvider>
  )
}
