import crypto from 'crypto'
import Project from '../models/project.js'
import { pushToBuildQueue } from './queue.service.js'

function verifyGithubSignature(secret, signatureHeader, payload) {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)

    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex')

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8')
    const actualBuffer = Buffer.from(signatureHeader, 'utf-8')

    if (expectedBuffer.length != actualBuffer.length) return false

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}


async function processGithubPush({
    repoUrl,
    branch,
    commitHash,
    commitMessage,
    author, signatureHeader,
    payload,
}) {
    try {
        const cleanRepoUrl=repoUrl.replace(/\.git$/,'')
        const project = await Project.findOne(
            {
                repoUrl:{$in:[cleanRepoUrl,`${cleanRepoUrl}`]},
                branch
            }
        )
        if (!project)
            return {
                success: false,
                status: 401,
                message: `No project found matching repository ${repoUrl} on branch ${branch}`
            }
        
        const isSignatureValid=verifyGithubSignature(project.webhookSecret,signatureHeader,payload)
        if(!isSignatureValid){
            return {
                success:false,
                status:401,
                message:'Invalid GitHuub webhook signature'
            }
        }

        project.status = 'QUEUED'
        await project.save()

        await pushToBuildQueue({
            project_id: project._id,
            repoUrl: project.repoUrl,
            branch: project.branch,
            commitHash,
            commitMessage,
            author
        })
        return {
            success: true,
            status: 200,
            message: 'Build job queued successfully',
            project_id: project._id
        }
    } catch (error) {
        console.error('[WebhookService] Error processing push even:', error.message)
        throw error
    }
}

export {
    verifyGithubSignature,
    processGithubPush,
}