import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

/**
 * Gate for authenticated routes.
 *
 * Also listens for the `launchbase:unauthorized` event that api.js dispatches
 * when a token refresh fails, so an expired session redirects immediately
 * instead of leaving a broken page on screen.
 */
export function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function onUnauthorized() {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
    window.addEventListener('launchbase:unauthorized', onUnauthorized)
    return () => window.removeEventListener('launchbase:unauthorized', onUnauthorized)
  }, [navigate, location.pathname])

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
