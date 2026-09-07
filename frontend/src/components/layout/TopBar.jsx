import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Triangle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { disconnectSocket } from '@/lib/socket'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function TopBar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Even if the server call fails, clear locally — the user asked to leave.
    }
    disconnectSocket()
    clearAuth()
    navigate('/login')
  }

  const initial = user?.username?.[0]?.toUpperCase() || '?'
  const onDashboard = location.pathname === '/dashboard'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-fg transition-opacity hover:opacity-80">
            <Triangle className="size-4 fill-fg" />
            <span className="text-sm font-semibold tracking-tight">LaunchBase</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!onDashboard && (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
          )}

          <Link to="/new">
            <Button size="sm">
              <Plus />
              <span className="hidden sm:inline">New Project</span>
            </Button>
          </Link>

          <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
            <div
              title={user?.email}
              className={cn(
                'flex size-7 items-center justify-center rounded-full',
                'bg-bg-elevated text-xs font-medium text-fg-muted ring-1 ring-border'
              )}
            >
              {initial}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="text-fg-subtle transition-colors hover:text-fg"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
