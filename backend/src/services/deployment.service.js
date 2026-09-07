import Deployment, { BUILD_STEPS } from '../models/deployment.model.js'
import { pushToBuildQueue } from './queue.service.js'

/**
 * Create a Deployment record and enqueue it for the build worker.
 *
 * Single path shared by the manual route (project.controller.js) and the GitHub
 * webhook (webhook.service.js) so both produce identical deployment records.
 *
 * If enqueueing fails the deployment is marked FAILED rather than left dangling
 * in QUEUED forever, and the error is rethrown for the caller to surface.
 *
 * @param {{project: object, trigger?: 'MANUAL'|'WEBHOOK', commitHash?: string,
 *          commitMessage?: string, author?: string}} params
 * @returns {Promise<object>} the created deployment document
 */
async function createDeployment({
    project,
    trigger = 'MANUAL',
    commitHash = null,
    commitMessage = null,
    author = null,
}) {
    const deployment = await Deployment.create({
        project: project._id,
        owner: project.owner,
        status: 'QUEUED',
        trigger,
        commitHash,
        commitMessage,
        author,
        steps: BUILD_STEPS.map((name) => ({ name, status: 'pending' })),
    })

    try {
        await pushToBuildQueue({
            project_id: String(project._id),
            deploymentId: String(deployment._id),
            repoUrl: project.repoUrl,
            branch: project.branch,
            commitHash,
            commitMessage,
            author,
        })
    } catch (error) {
        console.error('[DeploymentService] Failed to enqueue build:', error.message)
        await Deployment.findByIdAndUpdate(deployment._id, {
            status: 'FAILED',
            errorMessage: 'Failed to queue the build. Please try again.',
            finishedAt: new Date(),
        })
        throw new Error('Failed to queue the build. Please try again.')
    }

    return deployment
}

export { createDeployment }
