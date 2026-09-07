import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Github, Webhook } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/EmptyState'
import { useDeleteProject, useProject } from '@/hooks/useProjects'
import { API_BASE_URL, apiError } from '@/lib/api'
import { repoSlug } from '@/lib/format'

/** Read-only labelled row used for repo/branch metadata. */
function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[13px] text-fg-muted">{label}</span>
      <span className="font-mono text-[13px] text-fg">{children}</span>
    </div>
  )
}

export default function ProjectSettings() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const { data: project, isLoading, error } = useProject(projectId)
  const deleteProject = useDeleteProject()

  const [revealed, setRevealed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  const webhookUrl = `${API_BASE_URL}/api/webhook/github`

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(projectId)
      toast.success('Project deleted')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(apiError(err, 'Could not delete project'))
    }
  }

  if (error) {
    return (
      <AppShell className="max-w-2xl">
        <EmptyState icon={AlertCircle} title="Project not found" description={apiError(error)} />
      </AppShell>
    )
  }

  if (isLoading || !project) {
    return (
      <AppShell className="max-w-2xl">
        <div className="space-y-4">
          <div className="skeleton h-40 rounded-lg" />
          <div className="skeleton h-56 rounded-lg" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell className="max-w-2xl">
      <Link
        to={`/projects/${projectId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        {project.name}
      </Link>

      <h1 className="mb-6 text-lg font-semibold tracking-tight text-fg">Settings</h1>

      <div className="space-y-5">
        {/* ---- Repository ---- */}
        <Card>
          <CardHeader>
            <CardTitle>Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Project name">{project.name}</InfoRow>
            <InfoRow label="Branch">{project.branch}</InfoRow>
            <InfoRow label="Repository">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-accent"
              >
                <Github className="size-3.5" />
                {repoSlug(project.repoUrl)}
              </a>
            </InfoRow>
          </CardContent>
        </Card>

        {/* ---- Webhook ---- */}
        <Card>
          <CardHeader>
            <CardTitle>GitHub webhook</CardTitle>
            <CardDescription>
              Add this to your repository under Settings → Webhooks so every push to{' '}
              <code className="font-mono text-fg">{project.branch}</code> triggers a build.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Payload URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-border bg-bg px-3 py-2 font-mono text-xs text-fg">
                  {webhookUrl}
                </code>
                <CopyButton value={webhookUrl} label="Copy URL" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Secret</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-border bg-bg px-3 py-2 font-mono text-xs text-fg">
                  {revealed ? project.webhookSecret : '•'.repeat(40)}
                </code>
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  aria-label={revealed ? 'Hide secret' : 'Reveal secret'}
                  title={revealed ? 'Hide secret' : 'Reveal secret'}
                  className="inline-flex items-center rounded-md border border-border px-2 py-1 text-xs text-fg-muted transition-colors hover:border-border-hover hover:bg-bg-hover hover:text-fg"
                >
                  {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <CopyButton value={project.webhookSecret} label="Copy secret" />
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-border bg-bg px-3 py-2.5">
              <Webhook className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
              <p className="text-xs leading-relaxed text-fg-muted">
                Set the content type to{' '}
                <code className="font-mono text-fg">application/json</code> and send only the{' '}
                <code className="font-mono text-fg">push</code> event. Signatures are verified with
                HMAC SHA-256.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ---- Danger zone ---- */}
        <Card className="border-status-failed/25">
          <CardHeader className="border-status-failed/25">
            <CardTitle className="text-status-failed">Danger zone</CardTitle>
            <CardDescription>
              Deleting a project removes its deployment history and build logs. This cannot be
              undone.
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-status-failed/25 justify-end">
            <Button variant="dangerOutline" size="sm" onClick={() => setConfirmOpen(true)}>
              Delete project
            </Button>
          </CardFooter>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setConfirmName('')
        }}
        onConfirm={handleDelete}
        title="Delete this project?"
        confirmLabel="Delete permanently"
        confirmDisabled={confirmName.trim() !== project.name}
        loading={deleteProject.isPending}
      >
        <p className="text-[13px] leading-relaxed text-fg-muted">
          This deletes <span className="font-medium text-fg">{project.name}</span> and all of its
          deployments. Type the project name to confirm.
        </p>
        <input
          type="text"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={project.name}
          autoComplete="off"
          className="mt-3 w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-[13px] text-fg outline-none transition-colors hover:border-border-hover focus:border-border-strong"
        />
      </ConfirmDialog>
    </AppShell>
  )
}
