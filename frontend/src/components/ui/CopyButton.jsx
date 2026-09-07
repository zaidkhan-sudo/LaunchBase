import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Copy-to-clipboard button with a brief confirmation state.
 * Used for webhook secrets, URLs and full log dumps.
 */
export function CopyButton({ value, className, label = 'Copy', showLabel = false }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be denied (insecure context / permissions).
      // Silently ignore — the value is still visible on screen.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-fg-muted transition-colors',
        'hover:border-border-hover hover:bg-bg-hover hover:text-fg',
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-status-ready" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {showLabel && <span>{copied ? 'Copied' : label}</span>}
    </button>
  )
}
