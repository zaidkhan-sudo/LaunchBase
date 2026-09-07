import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Auth state.
 *
 * Only the short-lived access token is persisted here. The refresh token lives
 * in an httpOnly cookie set by the backend and is never readable from JS.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: ({ accessToken, user }) =>
        set((state) => ({
          accessToken: accessToken ?? state.accessToken,
          user: user ?? state.user,
        })),

      setUser: (user) => set({ user }),

      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'launchbase-auth',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
)

/** Read the token outside React (interceptors, socket handshake). */
export const getAccessToken = () => useAuthStore.getState().accessToken
export const setAccessToken = (accessToken) => useAuthStore.getState().setAuth({ accessToken })
export const clearAuth = () => useAuthStore.getState().clearAuth()
