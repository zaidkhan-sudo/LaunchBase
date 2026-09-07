import { cn } from '@/lib/utils'

/** Bordered surface. Never a shadow — the 1px border is the whole aesthetic. */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-bg-subtle', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('border-b border-border px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-sm font-medium text-fg', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('mt-1 text-[13px] text-fg-muted', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-border bg-bg/40 px-5 py-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
