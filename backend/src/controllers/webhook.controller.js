import { processGithubPush } from "../services/webhook.service.js";

async function handleGitHubWebhook(req, res) {
    try {
        const event = req.headers['x-github-event']
        const signatureHeader = req.headers['x-hub-signature-256']

        if (event === 'ping') {
            console.log('[WebhookController] Received GitHub ping event')
            return res.status(200).json({ msg: "Webhook ping received successfully" })
        }

        if (event != 'push') {
            console.log(`[WebhookController] Ignored event type: ${event}`)
            return res.status(200).json({ msg: `Ignored event: ${event}` })
        }

        const payload = req.body
        const repoUrl = payload.repository?.html_url || payload.repository?.clone_url
        const ref = payload.ref || ''
        const branch = ref.replace('refs/heads/', '')
        const commitHash = payload.after || payload.head_commit?.id
        const commitMessage = payload.head_commit?.message || 'No commit message'
        const author = payload.head_commit?.author?.name || payload.pusher?.name || 'Unknown'

        if (!repoUrl || !branch) return res.status(400).json({ msg: "Invalid payload: Missinig repository URL or branch" })

        console.log(`[WebhookController] Processing push for ${repoUrl} on branch ${branch}`)
        const result = await processGithubPush({
            repoUrl,
            branch,
            commitHash,
            commitMessage,
            author,
            signatureHeader,
            payload
        })
        if (!result.success) return res.status(result.status).json({ msg: result.message })
        return res.status(200).json(
            {
                msg:result.message,
                project_id:result.project_id
            }
        )
    } catch (error) {
        console.error('[WebhookController] Error handling webhook:',error.message)
        return res.status(500).json({msg:'Internal server error processign webhook'})
    }
}

export {handleGitHubWebhook}