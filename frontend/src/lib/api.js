import axios from 'axios'
import { getAccessToken, setAccessToken, clearAuth } from '@/store/auth.store'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * withCredentials is required on every request: the refresh token is an httpOnly
 * cookie, so the browser only sends it when credentials are explicitly enabled
 * (and the backend must reply with cors credentials:true — see app.js).
 */
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Access tokens live 15 minutes, so expiry during normal use is routine rather
 * than exceptional. On the first 401 we silently refresh and replay the request.
 *
 * Concurrent 401s share a single refresh promise — without this, five parallel
 * queries would fire five refreshes, and because each rotates the refresh token
 * server-side (auth.controller.js), the later ones would invalidate the earlier
 * and log the user out.
 */
let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token = res.data?.accessToken
        if (!token) throw new Error('No access token in refresh response')
        setAccessToken(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

/** Broadcast so the router can redirect to /login without importing history. */
function forceLogout() {
  clearAuth()
  window.dispatchEvent(new Event('launchbase:unauthorized'))
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    if (!response || !config) return Promise.reject(error)

    const isAuthEndpoint = config.url?.includes('/auth/refresh') || config.url?.includes('/auth/login')

    if (response.status === 401 && !config._retried && !isAuthEndpoint) {
      config._retried = true
      try {
        await refreshAccessToken()
        return api(config)
      } catch {
        forceLogout()
        return Promise.reject(error)
      }
    }

    // A failed refresh means the session is genuinely gone.
    if (response.status === 401 && config.url?.includes('/auth/refresh')) {
      forceLogout()
    }

    return Promise.reject(error)
  }
)

/** Pull a displayable message out of the backend's `{ msg }` error shape. */
export function apiError(error, fallback = 'Something went wrong') {
  return error?.response?.data?.msg || error?.message || fallback
}
