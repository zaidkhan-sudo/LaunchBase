import { GitCommitHorizontal, RotateCw, User, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { commitSubject, durationBetween, shortSha, timeAgo } from '@/lib/format'

/**
 * Deployment history. Selecting a row swaps the stepper and log terminal to that
 * deployment, so finished builds are fully re-readable.
 */
export function DeploymentList({ deployments, selectedId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-md" />
        ))}
      </div>
    )
  }

  if (!deployments?.length) {
    return (
      <p className="px-4 py-6 text-center text-[13px] text-fg-subtle">
        No deployments yet.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {deployments.map((deployment) => {
        const isSelected = String(deployment._id) === String(selectedId)
        const subject = commitSubject(deployment.commitMessage)
        const sha = shortSha(deployment.commitHash)
        const duration = durationBetween(deployment.startedAt, deployment.finishedAt)

        return (
          <li key={deployment._id}>
            <button
              type="button"
              onClick={() => onSelect(deployment._id)}
              className={cn(
                'w-full px-4 py-3 text-left transition-colors',
                isSelected ? 'bg-bg-hover' : 'hover:bg-bg-hover/60'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {deployment.trigger === 'WEBHOOK' ? (
                    <GitCommitHorizontal className="size-3.5 shrink-0 text-fg-subtle" />
                  ) : (
                    <Zap className="size-3.5 shrink-0 text-fg-subtle" />
                  )}
                  <span className="truncate text-[13px] text-fg">
                    {subject || (deployment.trigger === 'WEBHOOK' ? 'Git push' : 'Manual deploy')}
                  </span>
                </div>
                <StatusBadge status={deployment.status} size="sm" />
              </div>

              <div className="mt-1.5 flex items-center gap-2.5 pl-[22px] text-xs text-fg-subtle">
                {sha && <span className="font-mono">{sha}</span>}
                {deployment.author && (
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {deployment.author}
                  </span>
                )}
                <span>{timeAgo(deployment.createdAt)}</span>
                {duration && (
                  <span className="flex items-center gap-1">
                    <RotateCw className="size-3" />
                    {duration}
                  </span>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
