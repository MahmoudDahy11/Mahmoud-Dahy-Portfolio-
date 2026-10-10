import { useMutation } from '@tanstack/react-query'
import { submitContactMessage, type ContactSubmission } from '@/services/contactMessages'

/**
 * Sends a message from the public contact form.
 *
 * The hook owns the request and nothing else. Clearing the form after a successful send is
 * done by the page, because only it knows the form instance — a mutation that reached
 * into form state would be doing the page's job.
 *
 * No `retry` is set, matching the global default of zero. A failed send is a real failure
 * the visitor should see and act on, not a blip worth three silent attempts.
 */
export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: (values: ContactSubmission) => submitContactMessage(values),
  })
}
