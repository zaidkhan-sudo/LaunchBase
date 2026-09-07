import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input(
  { className, type = 'text', label, hint, error, prefix, ...props },
  ref
) {
  const generatedId = useId()
  const id = props.id || generatedId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-fg">
          {label}
        </label>
      )}

      <div
        className={cn(
          'flex items-center rounded-md border bg-bg-subtle transition-colors',
          'focus-within:border-border-strong',
          error ? 'border-status-failed/60' : 'border-border hover:border-border-hover'
        )}
      >
        {prefix && (
          <span className="shrink-0 border-r border-border py-2 pl-3 pr-2.5 font-mono text-[13px] text-fg-subtle">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? `${id}-desc` : undefined}
          className={cn(
            'w-full bg-transparent px-3 py-2 text-sm text-fg outline-none',
            'placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
      </div>

      {(error || hint) && (
        <p
          id={`${id}-desc`}
          className={cn('mt-1.5 text-xs', error ? 'text-status-failed' : 'text-fg-subtle')}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
})
