import { cn } from '@/lib/utils'

/**
 * Visual config per Project.status / Deployment.status value.
 * In-flight states pulse so the dashboard shows activity without polling.
 */
const STATUS_CONFIG = {
  IDLE: { label: 'Idle', dot: 'bg-status-idle', text: 'text-fg-muted', ring: 'border-border', pulse: false },
  QUEUED: { label: 'Queued', dot: 'bg-status-queued', text: 'text-status-queued', ring: 'border-status-queued/25', pulse: true },
  BUILDING: { label: 'Building', dot: 'bg-status-building', text: 'text-status-building', ring: 'border-status-building/25', pulse: true },
  DEPLOYING: { label: 'Deploying', dot: 'bg-status-deploying', text: 'text-status-deploying', ring: 'border-status-deploying/25', pulse: true },
  READY: { label: 'Ready', dot: 'bg-status-ready', text: 'text-status-ready', ring: 'border-status-ready/25', pulse: false },
  FAILED: { label: 'Failed', dot: 'bg-status-failed', text: 'text-status-failed', ring: 'border-status-failed/25', pulse: false },
}

const FALLBACK = STATUS_CONFIG.IDLE

export function StatusBadge({ status, size = 'md', className }) {
  const config = STATUS_CONFIG[status] || FALLBACK

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-bg-subtle font-medium',
        config.ring,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          config.dot,
          config.pulse && 'animate-status-pulse'
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}

/** Dot only — for dense rows where the label would not fit. */
export function StatusDot({ status, className }) {
  const config = STATUS_CONFIG[status] || FALLBACK
  return (
    <span
      title={config.label}
      className={cn('inline-block size-2 rounded-full', config.dot, config.pulse && 'animate-status-pulse', className)}
    />
  )
}

export const IN_FLIGHT_STATUSES = ['QUEUED', 'BUILDING', 'DEPLOYING']

export function isInFlight(status) {
  return IN_FLIGHT_STATUSES.includes(status)
}

export { STATUS_CONFIG }
