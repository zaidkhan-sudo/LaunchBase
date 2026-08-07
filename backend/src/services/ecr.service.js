import {
    GetAuthorizationTokenCommand,
    DescribeRepositoriesCommand,
    CreateRepositoryCommand
} from "@aws-sdk/client-ecr";
import { spawn } from 'child_process'
import { ecrClient } from "../config/aws.js";
import config from "../config/config.js";

async function getEcrLoginToken() {
    const command = new GetAuthorizationTokenCommand({})
    const response = await ecrClient.send(command)

    const authData = response.authorizationData?.[0]
    if (!authData || !authData.authorizationToken) {
        throw new Error("Failed to retrieve ECR authorization token from AWS")
    }

    const decodedToken = Buffer.from(authData.authorizationToken, 'base64').toString('utf-8')
    const password = decodedToken.split(':')[1]
    const registryUrl = authData.proxyEndpoint

    return {
        username: 'AWS',
        password,
        registryUrl,
    }
}


async function ensureEcrRepository(repoName) {
    try {
        const describeCmd = new DescribeRepositoriesCommand(
            {
                repositoryNames: [repoName],
            }
        )
        const response = await ecrClient.send(describeCmd)
        console.log(`ECR Repository '${repoName}' already exists.`)
        return response.repositories[0].repositoryUri
    } catch (error) {
        // RepositoryNotFoundException means we need to create it
        if (error.name === 'RepositoryNotFoundException') {
            console.log(`ECR Repository '${repoName}' not found. Creating...`)
            const createCmd = new CreateRepositoryCommand({
                repositoryName: repoName,
            })
            const createResponse = await ecrClient.send(createCmd)
            console.log(`Created ECR Repository: ${createResponse.repository.repositoryUri}`)
            return createResponse.repository.repositoryUri
        }
        throw error
    }
}



/**
 * Helper to run Docker CLI commands as a Promise
 */
function runDockerCommand(args, stdinInput = null) {
    return new Promise((resolve, reject) => {
        const child = spawn("docker", args)

        if (stdinInput) {
            child.stdin.write(stdinInput)
            child.stdin.end()
        }

        child.stdout.on("data", (data) => {
            console.log(`[Docker ECR] ${data.toString().trim()}`)
        })

        child.stderr.on("data", (data) => {
            console.warn(`[Docker ECR] ${data.toString().trim()}`)
        })

        child.on("close", (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`[Docker ECR] Command 'docker ${args.join(" ")}' failed with exit code ${code}`))
            }
        })

        child.on("error", (error) => {
            reject(error)
        })
    })
}

/**
 * 3. Log Docker in to AWS ECR using --password-stdin
 */
async function loginDockerToEcr(username, password, registryUrl) {
    console.log(`[ECR Service] Logging in Docker to ECR: ${registryUrl}...`)
    await runDockerCommand(
        ["login", "--username", username, "--password-stdin", registryUrl],
        password
    )
    console.log("[ECR Service] Docker successfully logged into ECR.")
}

/**
 * 4. Main orchestration function: Authenticate, Ensure Repo, Tag, and Push
 */
async function pushImageToEcr(localImageTag, ecrRepoName, tag = "latest") {
    try {
        console.log(`[ECR Service] Starting push process for '${localImageTag}' -> ECR Repo '${ecrRepoName}'...`)

        // 1. Get AWS auth token
        const { username, password, registryUrl } = await getEcrLoginToken()

        // 2. Authenticate Docker with ECR
        await loginDockerToEcr(username, password, registryUrl)

        // 3. Ensure repository exists and get its URI
        const repositoryUri = await ensureEcrRepository(ecrRepoName)
        const ecrImageUri = `${repositoryUri}:${tag}`

        // 4. Tag the local image for ECR
        console.log(`[ECR Service] Tagging image '${localImageTag}' as '${ecrImageUri}'...`)
        await runDockerCommand(["tag", localImageTag, ecrImageUri])

        // 5. Push the image to ECR
        console.log(`[ECR Service] Pushing image '${ecrImageUri}' to AWS ECR... (This may take a minute)`)
        await runDockerCommand(["push", ecrImageUri])

        console.log(`[ECR Service] Successfully pushed Docker image to ECR: ${ecrImageUri}`)
        return ecrImageUri
    } catch (error) {
        console.error("[ECR Service] Error pushing image to ECR:", error.message)
        throw error
    }
}

export {
    getEcrLoginToken,
    ensureEcrRepository,
    pushImageToEcr,
}
