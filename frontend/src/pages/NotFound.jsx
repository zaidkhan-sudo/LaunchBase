import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent px-4 text-center">
      <p className="font-mono text-sm text-fg-subtle">404</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-fg">Page not found</h1>
      <p className="mt-2 max-w-sm text-[13px] text-fg-muted">
        That page doesn&apos;t exist, or the project may have been deleted.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  )
}
