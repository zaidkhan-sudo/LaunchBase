import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Github } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { useCreateProject } from '@/hooks/useProjects'
import { apiError } from '@/lib/api'

// Mirrors the Project schema's match validator so the user sees the rule before
// submitting rather than as a mongoose validation error.
const NAME_PATTERN = /^[a-z0-9-]+$/

export default function NewProject() {
  const [form, setForm] = useState({ name: '', repoUrl: '', branch: 'main' })
  const [errors, setErrors] = useState({})

  const navigate = useNavigate()
  const createProject = useCreateProject()

  function update(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  /** Suggest a project name from the repo URL so the form is one field shorter. */
  function handleRepoBlur() {
    if (form.name || !form.repoUrl) return
    const match = form.repoUrl.match(/github\.com[/:][^/]+\/([^/.]+)/)
    if (match) {
      setForm((prev) => ({ ...prev, name: match[1].toLowerCase().replace(/[^a-z0-9-]/g, '-') }))
    }
  }

  function validate() {
    const next = {}
    const name = form.name.trim().toLowerCase()

    if (!name) next.name = 'Project name is required'
    else if (!NAME_PATTERN.test(name)) next.name = 'Only lowercase letters, numbers and hyphens'

    if (!form.repoUrl.trim()) next.repoUrl = 'Repository URL is required'
    else if (!/^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/.test(form.repoUrl.trim())) {
      next.repoUrl = 'Enter a full GitHub URL, e.g. https://github.com/user/repo'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    try {
      const data = await createProject.mutateAsync({
        name: form.name.trim().toLowerCase(),
        repoUrl: form.repoUrl.trim(),
        branch: form.branch.trim() || 'main',
      })

      toast.success('Build queued')

      // Land directly on the live build rather than the dashboard — the whole
      // point is watching it happen.
      const projectId = data.project?._id
      const deploymentId = data.deployment?._id
      navigate(
        deploymentId ? `/projects/${projectId}?deployment=${deploymentId}` : `/projects/${projectId}`
      )
    } catch (err) {
      const message = apiError(err, 'Could not create project')
      toast.error(message)
      if (message.toLowerCase().includes('name already exists')) {
        setErrors({ name: message })
      }
    }
  }

  return (
    <AppShell className="max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        Back to projects
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Import a Git repository</CardTitle>
          <CardDescription>
            LaunchBase clones the repo, generates a Dockerfile if there isn&apos;t one, builds the
            image, and runs it on AWS Fargate.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <Input
              label="Repository URL"
              name="repoUrl"
              placeholder="https://github.com/username/repo"
              value={form.repoUrl}
              onChange={update('repoUrl')}
              onBlur={handleRepoBlur}
              error={errors.repoUrl}
              hint={!errors.repoUrl ? 'Must be a public repository' : undefined}
              required
            />

            <Input
              label="Project name"
              name="name"
              placeholder="my-app"
              value={form.name}
              onChange={update('name')}
              error={errors.name}
              hint={!errors.name ? 'Lowercase letters, numbers and hyphens only' : undefined}
              required
            />

            <Input
              label="Branch"
              name="branch"
              placeholder="main"
              value={form.branch}
              onChange={update('branch')}
              hint="Pushes to this branch trigger a rebuild"
            />

            <div className="flex items-start gap-2.5 rounded-md border border-border bg-bg px-3 py-2.5">
              <Github className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
              <p className="text-xs leading-relaxed text-fg-muted">
                Node.js, Python and Go are detected automatically. To control the build yourself,
                commit a <code className="font-mono text-fg">Dockerfile</code> that listens on port{' '}
                <code className="font-mono text-fg">8080</code>.
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <span className="text-xs text-fg-subtle">The first build starts immediately.</span>
            <Button type="submit" loading={createProject.isPending}>
              Deploy
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AppShell>
  )
}
