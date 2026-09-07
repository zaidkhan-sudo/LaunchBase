import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectCard } from '@/components/ProjectCard'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { useProjects } from '@/hooks/useProjects'
import { apiError } from '@/lib/api'

export default function Dashboard() {
  const { data: projects, isLoading, error } = useProjects()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!projects) return []
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.repoUrl.toLowerCase().includes(q)
    )
  }, [projects, query])

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-fg">Projects</h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            {projects?.length
              ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
              : 'Deploy a repository to get started'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-bg-subtle pl-9 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle hover:border-border-hover focus:border-border-strong"
            />
          </div>
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={LayoutGrid}
          title="Could not load projects"
          description={apiError(error)}
        />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[152px] rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 && query ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description={`Nothing matched "${query}". Try a different name or repository.`}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No projects yet"
          description="Connect a GitHub repository and LaunchBase will containerize it and deploy it to AWS Fargate."
          action={
            <Link to="/new">
              <Button>
                <Plus />
                New Project
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </AppShell>
  )
}
