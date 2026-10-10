import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TextField } from '@/components/common/FormField'
import { loginSchema, type LoginValues } from '@/schemas'
import { useAuth } from '@/hooks/useAuth'
import { useSeo } from '@/hooks/useSeo'
import { toErrorMessage } from '@/lib/errors'
import { ADMIN_ROUTES } from '@/constants/routes'

/**
 * Admin sign-in.
 *
 * A successful `signIn` only proves the credentials are valid. Whether the account is an
 * admin is decided afterwards, by `RequireAdmin`, which reads the caller's own
 * `admin_users` row. Redirecting to the dashboard from here and letting that check run
 * means a signed-in non-admin gets an explanation rather than a page of failed requests.
 */
export default function LoginPage() {
  useSeo({ title: 'Sign in — Portfolio', description: 'Admin sign-in.', noIndex: true })

  const { signIn, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const isSubmitting = form.formState.isSubmitting
  const isAuthenticated = status === 'authenticated'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access the portfolio dashboard.</CardDescription>
      </CardHeader>

      <CardContent>
        {isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-sm">You are already signed in.</p>
            <Button
              type="button"
              onClick={() => {
                // Returns the admin to wherever they were originally heading.
                const from = (location.state as { from?: string } | null)?.from
                navigate(from ?? ADMIN_ROUTES.dashboard, { replace: true })
              }}
            >
              Go to dashboard
            </Button>
          </div>
        ) : (
          <FormProvider {...form}>
            <form
              noValidate
              className="space-y-5"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await signIn(values.email, values.password)
                  const from = (location.state as { from?: string } | null)?.from
                  navigate(from ?? ADMIN_ROUTES.dashboard, { replace: true })
                } catch (error) {
                  // The message shown is deliberately generic. Supabase returns the same
                  // text for an unknown email and a wrong password, and repeating it here
                  // would not tell an attacker anything the form does not already.
                  form.setError('password', { message: toErrorMessage(error, 'Could not sign in.') })
                }
              })}
            >
              <TextField name="email" label="Email" type="email" required autoComplete="email" />
              <TextField
                name="password"
                label="Password"
                type="password"
                required
                autoComplete="current-password"
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </FormProvider>
        )}
      </CardContent>
    </Card>
  )
}
