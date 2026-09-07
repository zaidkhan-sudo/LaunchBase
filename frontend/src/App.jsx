import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import VerifyEmail from '@/pages/VerifyEmail'
import Dashboard from '@/pages/Dashboard'
import NewProject from '@/pages/NewProject'
import ProjectDetail from '@/pages/ProjectDetail'
import ProjectSettings from '@/pages/ProjectSettings'
import NotFound from '@/pages/NotFound'

/** Keeps signed-in users off the auth screens. */
function GuestOnly({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken)
  return accessToken ? <Navigate to="/dashboard" replace /> : children
}
import DemoOne from '@/components/ui/demo'
import { Component as InfiniteGridBackground } from '@/components/ui/the-infinite-grid'

export default function App() {
  return (
    <InfiniteGridBackground className="flex min-h-screen flex-col">
      <Routes>
        <Route path="/demo" element={<DemoOne />} />
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        {/* Not GuestOnly: verification can legitimately continue mid-session. */}
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route
          path="/projects/:projectId/settings"
          element={<ProtectedRoute><ProjectSettings /></ProtectedRoute>}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </InfiniteGridBackground>
  )
}
