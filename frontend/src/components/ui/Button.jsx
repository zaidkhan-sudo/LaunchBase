import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // White-on-black is Vercel's real primary CTA, not a colored button.
        primary: 'bg-fg text-bg hover:bg-white',
        secondary: 'border border-border bg-transparent text-fg hover:bg-bg-hover hover:border-border-hover',
        ghost: 'bg-transparent text-fg-muted hover:bg-bg-hover hover:text-fg',
        danger: 'bg-status-failed text-white hover:brightness-110',
        dangerOutline: 'border border-status-failed/40 bg-transparent text-status-failed hover:bg-status-failed/10',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-4',
        lg: 'h-10 px-5',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export const Button = forwardRef(function Button(
  { className, variant, size, loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})

export { buttonVariants }
