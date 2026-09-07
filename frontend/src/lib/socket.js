import { io } from 'socket.io-client'
import { API_BASE_URL } from '@/lib/api'
import { getAccessToken } from '@/store/auth.store'

let socket = null

/**
 * Lazily create the single shared socket connection.
 *
 * The token is read fresh inside `auth` on every (re)connect attempt, so a token
 * refreshed by the axios interceptor is picked up automatically on reconnect
 * rather than reusing the stale one captured at first connect.
 */
export function getSocket() {
  if (socket) return socket

  socket = io(API_BASE_URL, {
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: (cb) => cb({ token: getAccessToken() }),
  })

  if (import.meta.env.DEV) {
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message)
    })
  }

  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
