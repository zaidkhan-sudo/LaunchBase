import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api, apiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { AuthShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  // Prefilled when arriving from register/login; editable if landed here directly.
  const [email, setEmail] = useState(location.state?.email || '')
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputsRef = useRef([])
  const code = digits.join('')

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  function focusInput(index) {
    inputsRef.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus()
  }

  function handleChange(index, rawValue) {
    const value = rawValue.replace(/\D/g, '')
    if (!value) return

    setError('')

    // A multi-character value means the user pasted or typed fast — spread it
    // across the remaining boxes instead of dropping everything but the first.
    setDigits((prev) => {
      const next = [...prev]
      for (let i = 0; i < value.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = value[i]
      }
      return next
    })

    focusInput(index + value.length)
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      setDigits((prev) => {
        const next = [...prev]
        // Clear this box if filled, otherwise step back and clear that one.
        if (next[index]) next[index] = ''
        else if (index > 0) next[index - 1] = ''
        return next
      })
      if (!digits[index] && index > 0) focusInput(index - 1)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusInput(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusInput(index + 1)
    }
  }

  function handlePaste(event) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    focusInput(pasted.length)
  }

  async function handleSubmit(event) {
    event?.preventDefault()
    if (code.length !== OTP_LENGTH || !email) return

    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-email', { otp: code, email: email.trim() })

      // Verification creates a session and returns an access token, so the user
      // lands authenticated rather than being sent back to sign in.
      if (data.accessToken) {
        setAuth({ accessToken: data.accessToken, user: data.user })
        toast.success('Email verified')
        navigate('/dashboard', { replace: true })
      } else {
        toast.success('Email verified — please sign in')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      setError(apiError(err, 'Verification failed'))
      setDigits(Array(OTP_LENGTH).fill(''))
      focusInput(0)
    } finally {
      setLoading(false)
    }
  }

  // Auto-submit once the last box is filled — no need to reach for the button.
  useEffect(() => {
    if (code.length === OTP_LENGTH && email && !loading) handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <AuthShell
      title="Verify your email"
      subtitle={email ? `We sent a 6-digit code to ${email}` : 'Enter the 6-digit code we sent you'}
      footer={
        <Link to="/login" className="text-fg underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {!location.state?.email && (
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        <div>
          <label className="mb-2 block text-[13px] font-medium text-fg">Verification code</label>
          <div className="flex gap-2" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={OTP_LENGTH}
                aria-label={`Digit ${index + 1}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => e.target.select()}
                disabled={loading}
                className={cn(
                  'size-11 rounded-md border bg-bg text-center font-mono text-lg text-fg outline-none transition-colors',
                  'focus:border-border-strong disabled:opacity-60',
                  error ? 'border-status-failed/60' : 'border-border hover:border-border-hover'
                )}
              />
            ))}
          </div>
          {error && <p className="mt-2 text-xs text-status-failed">{error}</p>}
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={code.length !== OTP_LENGTH || !email}
        >
          Verify email
        </Button>
      </form>
    </AuthShell>
  )
}
