import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api, apiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { AuthShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth({ accessToken: data.accessToken, user: data.user })
      toast.success(`Welcome back, ${data.user?.username || 'there'}`)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      const message = apiError(err, 'Login failed')
      setError(message)

      // The backend rejects unverified accounts at login; send them to finish it
      // rather than leaving them stuck on an error they cannot resolve here.
      if (message.toLowerCase().includes('not verified')) {
        toast.error('Email not verified — enter the code we sent you')
        navigate('/verify-email', { state: { email } })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Sign in to LaunchBase"
      subtitle="Deploy from Git to AWS Fargate"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-fg underline-offset-4 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
