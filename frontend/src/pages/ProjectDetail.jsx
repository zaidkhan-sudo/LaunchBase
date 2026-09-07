import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Github,
  RotateCw,
  Settings,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge, isInFlight } from '@/components/StatusBadge'
import { BuildStepper } from '@/components/deployment/BuildStepper'
import { LogTerminal } from '@/components/deployment/LogTerminal'
import { DeploymentList } from '@/components/deployment/DeploymentList'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { useDeployments, useProject, useRedeploy } from '@/hooks/useProjects'
import { useDeploymentStream } from '@/hooks/useDeploymentStream'
import { apiError } from '@/lib/api'
import { commitSubject, durationBetween, repoSlug, shortSha } from '@/lib/format'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId)
  const { data: deployments, isLoading: deploymentsLoading } = useDeployments(projectId)
  const redeploy = useRedeploy(projectId)

  // The URL is the source of truth for which deployment is shown, so the view is
  // shareable and survives a refresh. Falls back to the newest one.
  const selectedId =
    searchParams.get('deployment') ||
    project?.latestDeployment?._id ||
    deployments?.[0]?._id ||
    null

  const { logs, steps, status, deployment, connected, loading } = useDeploymentStream(
    projectId,
    selectedId
  )

  // Live status wins over the cached project record mid-build.
  const effectiveStatus = status || project?.status

  function selectDeployment(id) {
    setSearchParams(id ? { deployment: id } : {}, { replace: true })
  }

  // When a new build starts (e.g. a webhook fires while the page is open), follow
  // it instead of leaving the user on a finished deployment.
  useEffect(() => {
    if (!deployments?.length) return
    const newest = deployments[0]
    if (isInFlight(newest.status) && String(newest._id) !== String(selectedId)) {
      selectDeployment(newest._id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deployments])

  async function handleRedeploy() {
    try {
      const data = await redeploy.mutateAsync()
      toast.success('Redeploy queued')
      if (data.deployment?._id) selectDeployment(data.deployment._id)
    } catch (err) {
      const message = apiError(err, 'Could not queue redeploy')
      toast.error(message)
      // 409 means a build is already running — jump to it rather than dead-ending.
      if (err?.response?.status === 409 && err.response.data?.deploymentId) {
        selectDeployment(err.response.data.deploymentId)
      }
    }
  }

  const activeDeployment = deployment || deployments?.find((d) => String(d._id) === String(selectedId))
  const buildDuration = durationBetween(activeDeployment?.startedAt, activeDeployment?.finishedAt)
  const subject = commitSubject(activeDeployment?.commitMessage)
  const sha = shortSha(activeDeployment?.commitHash)

  const totalSteps = useMemo(() => steps.filter((s) => s.status === 'success').length, [steps])

  if (projectError) {
    return (
      <AppShell>
        <EmptyState
          icon={AlertCircle}
          title="Project not found"
          description={apiError(projectError)}
          action={
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to projects
            </Button>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell wide>
      <Link
        to="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        Projects
      </Link>

      {/* ---- Header ---- */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-lg font-semibold tracking-tight text-fg">
              {projectLoading ? 'Loading…' : project?.name}
            </h1>
            {effectiveStatus && <StatusBadge status={effectiveStatus} />}
          </div>

          {project && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-muted">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-fg"
              >
                <Github className="size-3.5" />
                {repoSlug(project.repoUrl)}
              </a>
              <span className="flex items-center gap-1.5">
                <GitBranch className="size-3" />
                {project.branch}
              </span>
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-accent transition-colors hover:text-accent-hover"
                >
                  <ExternalLink className="size-3" />
                  {project.liveUrl}
                </a>
              ) : (
                // Expected until ALB routing exists (Day 13) — not an error state.
                <span className="text-fg-subtle">URL pending — load balancer not configured</span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link to={`/projects/${projectId}/settings`}>
            <Button variant="secondary" size="sm">
              <Settings />
              Settings
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleRedeploy}
            loading={redeploy.isPending}
            disabled={isInFlight(effectiveStatus)}
          >
            <RotateCw />
            Redeploy
          </Button>
        </div>
      </div>

      {/* ---- Build view ---- */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Build steps</CardTitle>
              <span className="font-mono text-xs text-fg-subtle">
                {totalSteps}/{steps.length}
              </span>
            </CardHeader>
            <CardContent>
              <BuildStepper steps={steps} />

              {(subject || sha || buildDuration) && (
                <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs">
                  {subject && <p className="truncate text-fg-muted">{subject}</p>}
                  <div className="flex items-center gap-2.5 text-fg-subtle">
                    {sha && <span className="font-mono">{sha}</span>}
                    {activeDeployment?.author && <span>{activeDeployment.author}</span>}
                    {buildDuration && <span>{buildDuration}</span>}
                  </div>
                </div>
              )}

              {activeDeployment?.errorMessage && (
                <div className="mt-4 rounded-md border border-status-failed/30 bg-status-failed/5 px-3 py-2.5">
                  <p className="text-xs leading-relaxed text-status-failed">
                    {activeDeployment.errorMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Deployments</CardTitle>
            </CardHeader>
            <DeploymentList
              deployments={deployments}
              selectedId={selectedId}
              onSelect={selectDeployment}
              loading={deploymentsLoading}
            />
          </Card>
        </div>

        <LogTerminal
          logs={logs}
          status={status || activeDeployment?.status}
          connected={connected}
          loading={loading}
        />
      </div>
    </AppShell>
  )
}
