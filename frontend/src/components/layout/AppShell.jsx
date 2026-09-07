import { TopBar } from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'

/** Authenticated page frame: fixed top bar over a centered content column. */
export function AppShell({ children, className, wide = false }) {
  return (
    <div className="min-h-screen bg-transparent">
      <TopBar />
      <main
        className={cn(
          'mx-auto px-4 py-8 sm:px-6',
          wide ? 'max-w-7xl' : 'max-w-6xl',
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}

/** Centered single-column frame for the auth screens. */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="mt-2 text-[13px] text-fg-muted">{subtitle}</p>}
        </div>

        <div className="rounded-lg border border-border bg-bg-subtle/80 backdrop-blur-md p-6 relative z-10 shadow-xl">{children}</div>

        {footer && <div className="mt-6 text-center text-[13px] text-fg-muted">{footer}</div>}
      </div>
    </div>
  )
}
