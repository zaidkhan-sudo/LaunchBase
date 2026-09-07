import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, Download, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logTime } from '@/lib/format'
import { CopyButton } from '@/components/ui/CopyButton'

// How close to the bottom still counts as "at the bottom". Without a tolerance,
// sub-pixel scroll heights make the check flicker.
const BOTTOM_THRESHOLD_PX = 40

export function LogTerminal({ logs, status, connected, loading, className }) {
  const scrollRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)

  /**
   * Scrolling up must disengage auto-scroll — otherwise the user is yanked back
   * to the bottom every time a new line arrives, making it impossible to read
   * anything mid-build. Re-engages when they return to the bottom themselves.
   */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setAutoScroll(distanceFromBottom <= BOTTOM_THRESHOLD_PX)
  }, [])

  // Layout effect so the scroll happens in the same frame the lines paint.
  useLayoutEffect(() => {
    if (!autoScroll) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs, autoScroll])

  function scrollToBottom() {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
    setAutoScroll(true)
  }

  const plainText = logs.map((l) => l.line).join('\n')

  function handleDownload() {
    const blob = new Blob([plainText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `build-log-${Date.now()}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const isStreaming = status === 'BUILDING' || status === 'DEPLOYING' || status === 'QUEUED'

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-bg-subtle', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-fg-subtle" />
          <span className="text-[13px] font-medium text-fg">Build logs</span>
          {logs.length > 0 && (
            <span className="font-mono text-xs text-fg-subtle">{logs.length}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  connected ? 'bg-status-ready animate-status-pulse' : 'bg-status-queued'
                )}
              />
              {connected ? 'Live' : 'Reconnecting'}
            </span>
          )}
          {logs.length > 0 && (
            <>
              <CopyButton value={plainText} label="Copy logs" />
              <button
                type="button"
                onClick={handleDownload}
                title="Download logs"
                aria-label="Download logs"
                className="inline-flex items-center rounded-md border border-border px-2 py-1 text-xs text-fg-muted transition-colors hover:border-border-hover hover:bg-bg-hover hover:text-fg"
              >
                <Download className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[460px] overflow-y-auto overflow-x-auto bg-bg px-4 py-3 font-mono text-xs leading-relaxed"
        >
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-3 rounded" style={{ width: `${45 + i * 8}%` }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-fg-subtle">
              {isStreaming ? 'Waiting for output…' : 'No logs recorded for this deployment.'}
            </p>
          ) : (
            logs.map((entry, index) => (
              <div key={index} className="flex gap-3 hover:bg-bg-subtle/60">
                <span className="shrink-0 select-none tabular-nums text-fg-subtle/60">
                  {logTime(entry.ts)}
                </span>
                <span
                  className={cn(
                    'whitespace-pre-wrap break-all',
                    entry.stream === 'stderr' && 'text-status-failed',
                    entry.stream === 'system' && 'text-accent',
                    entry.stream === 'stdout' && 'text-fg-muted'
                  )}
                >
                  {entry.line}
                </span>
              </div>
            ))
          )}
        </div>

        {!autoScroll && logs.length > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border-hover bg-bg-elevated px-3 py-1.5 text-xs text-fg transition-colors hover:bg-bg-hover"
          >
            <ArrowDown className="size-3.5" />
            Jump to bottom
          </button>
        )}
      </div>
    </div>
  )
}
