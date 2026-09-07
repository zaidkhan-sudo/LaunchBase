import crypto from 'crypto'
import Project from '../models/project.js'
import { createDeployment } from './deployment.service.js'

/**
 * Verify GitHub's HMAC signature.
 *
 * `payload` must be the RAW request body (a Buffer). GitHub computes the digest
 * over the exact bytes it sent, so re-stringifying a parsed object can change key
 * order or unicode escaping and fail a legitimate signature.
 */
function verifyGithubSignature(secret, signatureHeader, payload) {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

    const payloadBuffer = Buffer.isBuffer(payload)
        ? payload
        : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf-8')

    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payloadBuffer)
        .digest('hex')

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8')
    const actualBuffer = Buffer.from(signatureHeader, 'utf-8')

    // timingSafeEqual throws on length mismatch, so check first.
    if (expectedBuffer.length != actualBuffer.length) return false

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}


async function processGithubPush({
    repoUrl,
    branch,
    commitHash,
    commitMessage,
    author,
    signatureHeader,
    rawBody,
    payload,
}) {
    try {
        const cleanRepoUrl = repoUrl.replace(/\.git$/, '')

        // Match both forms: projects may have been stored with or without the
        // .git suffix depending on what the user pasted.
        const project = await Project.findOne(
            {
                repoUrl: { $in: [cleanRepoUrl, `${cleanRepoUrl}.git`] },
                branch
            }
        )
        if (!project)
            return {
                success: false,
                status: 404,
                message: `No project found matching repository ${repoUrl} on branch ${branch}`
            }

        const isSignatureValid = verifyGithubSignature(
            project.webhookSecret,
            signatureHeader,
            rawBody ?? payload
        )
        if (!isSignatureValid) {
            return {
                success: false,
                status: 401,
                message: 'Invalid GitHub webhook signature'
            }
        }

        project.status = 'QUEUED'
        await project.save()

        const deployment = await createDeployment({
            project,
            trigger: 'WEBHOOK',
            commitHash,
            commitMessage,
            author
        })

        return {
            success: true,
            status: 200,
            message: 'Build job queued successfully',
            project_id: project._id,
            deploymentId: deployment._id
        }
    } catch (error) {
        console.error('[WebhookService] Error processing push event:', error.message)
        throw error
    }
}

export {
    verifyGithubSignature,
    processGithubPush,
}
