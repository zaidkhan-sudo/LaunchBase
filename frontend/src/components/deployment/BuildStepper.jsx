import { useEffect, useState } from 'react'
import { Check, CircleDashed, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/format'

/** Human labels for the worker's step names. */
const STEP_LABELS = {
  CLONE: 'Cloning repository',
  DOCKERFILE: 'Preparing Dockerfile',
  BUILD: 'Building image',
  PUSH: 'Pushing to ECR',
  DEPLOY: 'Deploying to Fargate',
}

function StepIcon({ status }) {
  if (status === 'success') return <Check className="size-3.5 text-status-ready" />
  if (status === 'failed') return <X className="size-3.5 text-status-failed" />
  if (status === 'running') return <Loader2 className="size-3.5 animate-spin text-status-building" />
  return <CircleDashed className="size-3.5 text-fg-subtle" />
}

/**
 * Duration cell. A running step counts up in real time, which is what makes the
 * page feel alive during a long docker build.
 */
function StepDuration({ step }) {
  const [now, setNow] = useState(() => Date.now())
  const isRunning = step.status === 'running'

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [isRunning])

  if (!step.startedAt) return null

  const start = new Date(step.startedAt).getTime()
  const end = isRunning ? now : step.finishedAt ? new Date(step.finishedAt).getTime() : null
  if (end == null) return null

  const text = formatDuration(Math.max(0, end - start))
  if (!text) return null

  return (
    <span
      className={cn(
        'font-mono text-xs tabular-nums',
        isRunning ? 'text-status-building' : 'text-fg-subtle'
      )}
    >
      {text}
    </span>
  )
}

export function BuildStepper({ steps, className }) {
  return (
    <ol className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isActive = step.status === 'running'
        const isDone = step.status === 'success'
        const isFailed = step.status === 'failed'

        return (
          <li key={step.name} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line, tinted to show how far the build progressed. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px',
                  isDone ? 'bg-status-ready/30' : 'bg-border'
                )}
              />
            )}

            <span
              className={cn(
                'relative z-10 mt-0.5 flex size-[23px] shrink-0 items-center justify-center rounded-full border bg-bg',
                isDone && 'border-status-ready/40',
                isActive && 'border-status-building/50',
                isFailed && 'border-status-failed/40',
                !isDone && !isActive && !isFailed && 'border-border'
              )}
            >
              <StepIcon status={step.status} />
            </span>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pt-1">
              <span
                className={cn(
                  'truncate text-[13px]',
                  isActive && 'font-medium text-fg',
                  isDone && 'text-fg-muted',
                  isFailed && 'font-medium text-status-failed',
                  step.status === 'pending' && 'text-fg-subtle',
                  step.status === 'skipped' && 'text-fg-subtle line-through'
                )}
              >
                {STEP_LABELS[step.name] || step.name}
              </span>

              <StepDuration step={step} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { STEP_LABELS }
