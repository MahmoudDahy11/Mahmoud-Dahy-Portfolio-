import { z } from 'zod'
import { emailField } from './fields'

/**
 * Sign-in form.
 *
 * Only checks that both fields are present. A wrong password is reported by Supabase, and
 * the message is deliberately the same as it would be for an unknown email.
 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: 'Password is required.' }),
})

export type LoginValues = z.infer<typeof loginSchema>
