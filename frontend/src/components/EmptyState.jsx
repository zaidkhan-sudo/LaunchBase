import { cn } from '@/lib/utils'

/** Bordered placeholder for zero-state and no-results views. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-subtle px-6 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-10 items-center justify-center rounded-full border border-border bg-bg-elevated">
          <Icon className="size-4 text-fg-subtle" />
        </div>
      )}
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
