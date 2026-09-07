import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api, apiError } from '@/lib/api'
import { AuthShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    githubUsername: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    // Mirrors the backend's minLength:8 so the user isn't told to wait for a
    // round-trip just to learn the password is too short.
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        githubUsername: form.githubUsername.trim() || undefined,
      })
      toast.success('Account created — check your email for the code')
      navigate('/verify-email', { state: { email: form.email.trim() } })
    } catch (err) {
      setError(apiError(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Connect a repo and ship it in minutes"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-fg underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="zaid"
          minLength={3}
          value={form.username}
          onChange={update('username')}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update('password')}
          error={error}
          required
        />

        <Input
          label="GitHub username"
          name="githubUsername"
          placeholder="optional"
          hint="Optional — shown on your deployments"
          value={form.githubUsername}
          onChange={update('githubUsername')}
        />

        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
