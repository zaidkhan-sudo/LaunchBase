import { Link } from 'react-router-dom'
import { ExternalLink, GitBranch, GitCommitHorizontal } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { commitSubject, repoSlug, shortSha, timeAgo } from '@/lib/format'

export function ProjectCard({ project }) {
  const deployment = project.latestDeployment
  const subject = commitSubject(deployment?.commitMessage)
  const sha = shortSha(deployment?.commitHash)

  return (
    <Link
      to={`/projects/${project._id}`}
      className="group block rounded-lg border border-border bg-bg-subtle p-4 transition-colors hover:border-border-hover hover:bg-bg-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-fg">{project.name}</h3>
          <p className="mt-1 truncate text-xs text-fg-subtle">{repoSlug(project.repoUrl)}</p>
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      <div className="mt-4 space-y-1.5 border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-fg-muted">
          <GitCommitHorizontal className="size-3.5 shrink-0 text-fg-subtle" />
          <span className="truncate">
            {subject || (deployment ? 'Manual deploy' : 'No deployments yet')}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-fg-subtle">
          <span className="flex items-center gap-1.5">
            <GitBranch className="size-3" />
            {project.branch}
            {sha && <span className="font-mono">· {sha}</span>}
          </span>
          <span>{timeAgo(deployment?.createdAt || project.updatedAt)}</span>
        </div>
      </div>

      {project.liveUrl && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-accent">
          <ExternalLink className="size-3" />
          <span className="truncate">{project.liveUrl}</span>
        </div>
      )}
    </Link>
  )
}
