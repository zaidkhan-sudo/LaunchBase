import {
    RegisterTaskDefinitionCommand,
    RunTaskCommand,
    CreateServiceCommand,
    UpdateServiceCommand,
    DescribeServicesCommand,
    DeleteServiceCommand,
} from "@aws-sdk/client-ecs"
import { ecsClient } from "../config/aws.js"
import config from "../config/config.js"
import { CONTAINER_PORT, targetGroupName } from "./alb.service.js"

/*
  The container name is referenced by the ALB wiring in CreateService: the
  loadBalancers block must name a container/port pair that exists in the task
  definition, or ECS rejects the service with an opaque validation error.
*/
const CONTAINER_NAME = "user-app-container"

export async function registerECSTaskDefinition(projectSlug, ecrImageUri) {
    try {
        console.log(`[ECS Service] Registering Task Definition for ${projectSlug}`)

        const command = new RegisterTaskDefinitionCommand(
            {
                family: `vercel-clone-task-${projectSlug}`,
                networkMode: "awsvpc",
                requiresCompatibilities: ["FARGATE"],
                cpu: "256",
                memory: "512",

                executionRoleArn: config.AWS_ECS_EXECUTION_ROLE_ARN,

                containerDefinitions: [
                    {
                        name: CONTAINER_NAME,
                        image: ecrImageUri,
                        essential: true,
                        portMappings: [
                            {
                                containerPort: CONTAINER_PORT,
                                hostPort: CONTAINER_PORT,
                                protocol: "tcp"
                            }
                        ],
                        logConfiguration: {
                            logDriver: "awslogs",
                            options: {
                                "awslogs-group": "/ecs/vercel-clone",
                                "awslogs-region": config.AWS_REGION,
                                "awslogs-stream-prefix": "ecs"
                            }
                        }
                    }
                ]
            }
        )

        const response= await ecsClient.send(command)
        const taskDefArn=response.taskDefinition.taskDefinitionArn

        console.log(`[ECS Service] Succesfully registered Task Definition: ${taskDefArn}`)
        return taskDefArn

    } catch (error) {
        console.error("[ECS Service] Error registering Task Definition:", error.message)
        throw error
    }
}



/**
 * Step 2: Run the Task (Spinning up the serverless container)
 *
 * One-shot launch with no supervisor: nothing restarts the task if it dies, and
 * its public IP changes on every deploy. Kept for the no-ALB path, where there
 * is nothing to route to anyway. When ALB routing is configured, the worker uses
 * ensureECSService instead.
 *
 * @param {string} taskDefinitionArn - The ARN returned from registerECSTaskDefinition
 * @returns {string} The ARN of the running task
 */
export async function runECSTask(taskDefinitionArn) {
    try {
        console.log(`[ECS Service] Starting Fargate task for definition: ${taskDefinitionArn}...`)

        const command = new RunTaskCommand({
            cluster: config.AWS_ECS_CLUSTER_NAME, // Make sure to add this to .env (e.g., vercel-clone-cluster)
            taskDefinition: taskDefinitionArn,
            launchType: "FARGATE",
            count: 1,

            networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: "ENABLED", // Required to pull images from ECR
                    subnets: [
                        config.AWS_VPC_SUBNET_ID_1,
                        config.AWS_VPC_SUBNET_ID_2
                    ],
                    securityGroups: [
                        config.AWS_VPC_SECURITY_GROUP_ID
                    ]
                }
            }
        })

        const response = await ecsClient.send(command)

        if (response.tasks && response.tasks.length > 0) {
            const taskArn = response.tasks[0].taskArn
            console.log(`[ECS Service] Successfully launched Task: ${taskArn}`)
            return taskArn
        } else {
            throw new Error("ECS failed to start the task. Check AWS console for details.")
        }

    } catch (error) {
        console.error("[ECS Service] Error running ECS task:", error.message)
        throw error
    }
}

/*
  Everything below is the ALB path.

  A Service, unlike a one-shot task, is a supervisor. It registers the task's
  private IP into the target group when it starts and deregisters on stop, keeps
  the requested number of copies alive, and performs a rolling replacement on
  redeploy. Registering IPs by hand would break the moment a task restarted.
*/

/**
 * Deliberately the same string as the target group name so the two resources for
 * a project are always identifiable as a pair. Both AWS name rules are satisfied
 * by it: ECS allows up to 255 chars of [a-zA-Z0-9_-], which is a superset of the
 * 32-char alphanumeric-and-hyphen form built for target groups.
 */
export function ecsServiceName(projectId, projectName) {
    return targetGroupName(projectId, projectName)
}

const awsvpcNetworkConfiguration = () => ({
    awsvpcConfiguration: {
        // Public IP is still required: without a NAT gateway (~$32/month) the
        // task cannot reach ECR to pull its image.
        assignPublicIp: "ENABLED",
        subnets: [config.AWS_VPC_SUBNET_ID_1, config.AWS_VPC_SUBNET_ID_2],
        securityGroups: [config.AWS_VPC_SECURITY_GROUP_ID],
    },
})

/**
 * Current state of a service, or null when it does not exist / was deleted.
 * ECS keeps deleted services queryable as INACTIVE for a while, which is treated
 * as absent so a redeploy after deletion creates cleanly instead of trying to
 * update a corpse.
 */
export async function describeECSService(serviceName) {
    const response = await ecsClient.send(
        new DescribeServicesCommand({
            cluster: config.AWS_ECS_CLUSTER_NAME,
            services: [serviceName],
        })
    )

    const service = response.services?.[0]
    if (!service || service.status === "INACTIVE") return null

    // The PRIMARY deployment is the one currently rolling out.
    const primary = (service.deployments || []).find((d) => d.status === "PRIMARY")

    return {
        serviceArn: service.serviceArn,
        status: service.status,
        desiredCount: service.desiredCount ?? 0,
        runningCount: service.runningCount ?? 0,
        pendingCount: service.pendingCount ?? 0,
        rolloutState: primary?.rolloutState || null,
        rolloutStateReason: primary?.rolloutStateReason || null,
        // Newest first. ECS reports "unable to place task", image pull failures
        // and health-check failures here — the only place they are visible.
        events: (service.events || []).slice(0, 5).map((e) => e.message),
    }
}

/**
 * Create the service, or roll the existing one onto a new task definition.
 *
 * Idempotent: a redeploy hits the update branch. Without it, CreateService
 * throws InvalidParameterException on the second deploy of any project.
 *
 * @returns {{serviceArn:string, created:boolean}}
 */
export async function ensureECSService({ projectId, projectName, taskDefinitionArn, targetGroupArn }) {
    const serviceName = ecsServiceName(projectId, projectName)
    const existing = await describeECSService(serviceName)

    /*
      DRAINING means a delete is still in flight. Creating a service with the
      same name during that window fails, and the only fix is to wait — so this
      surfaces as a clear error rather than an AWS one.
    */
    if (existing?.status === "DRAINING") {
        throw new Error(
            `ECS service '${serviceName}' is still draining from a previous delete. Retry in a minute.`
        )
    }

    if (existing) {
        console.log(`[ECS Service] Updating existing service '${serviceName}' to new task definition...`)

        await ecsClient.send(
            new UpdateServiceCommand({
                cluster: config.AWS_ECS_CLUSTER_NAME,
                service: serviceName,
                taskDefinition: taskDefinitionArn,
                // Covers a service that was previously scaled to zero.
                desiredCount: 1,
                // Rolling replacement even when the task definition is unchanged
                // (e.g. the :latest image tag was overwritten by a new push).
                forceNewDeployment: true,
            })
        )

        console.log(`[ECS Service] Rolling deployment started for '${serviceName}'.`)
        return { serviceArn: existing.serviceArn, created: false }
    }

    console.log(`[ECS Service] Creating service '${serviceName}'...`)

    const response = await ecsClient.send(
        new CreateServiceCommand({
            cluster: config.AWS_ECS_CLUSTER_NAME,
            serviceName,
            taskDefinition: taskDefinitionArn,
            desiredCount: 1,
            launchType: "FARGATE",
            networkConfiguration: awsvpcNetworkConfiguration(),

            loadBalancers: [
                {
                    targetGroupArn,
                    // Must match the task definition exactly.
                    containerName: CONTAINER_NAME,
                    containerPort: CONTAINER_PORT,
                },
            ],

            /*
              User apps can take a while to bind their port. Without a grace
              period the ALB marks the target unhealthy, ECS kills the task, and
              the service crash-loops on an app that would have been fine.
            */
            healthCheckGracePeriodSeconds: 60,

            deploymentConfiguration: {
                // 100/200 keeps the old task serving until the new one is
                // healthy — the zero-downtime path. Costs a second task for
                // roughly a minute during the rollover.
                minimumHealthyPercent: 100,
                maximumPercent: 200,
                deploymentCircuitBreaker: {
                    // Give up on a crash-looping deploy instead of retrying
                    // forever, and put the previous version back.
                    enable: true,
                    rollback: true,
                },
            },
        })
    )

    const serviceArn = response.service.serviceArn
    console.log(`[ECS Service] Created service: ${serviceArn}`)
    return { serviceArn, created: true }
}

/**
 * Scale a service without deleting it. desiredCount 0 stops all tasks, which
 * ends Fargate billing while keeping the target group and listener rule intact.
 */
export async function setECSServiceDesiredCount(serviceName, desiredCount) {
    await ecsClient.send(
        new UpdateServiceCommand({
            cluster: config.AWS_ECS_CLUSTER_NAME,
            service: serviceName,
            desiredCount,
        })
    )
    console.log(`[ECS Service] Set '${serviceName}' desiredCount=${desiredCount}`)
}

/**
 * Delete a service. force stops running tasks rather than requiring a manual
 * scale-to-zero first.
 *
 * Must happen before the target group is deleted — an in-use target group throws
 * ResourceInUse. Swallows "already gone" so project deletion stays idempotent.
 */
export async function deleteECSService(serviceName) {
    if (!serviceName) return

    try {
        await ecsClient.send(
            new DeleteServiceCommand({
                cluster: config.AWS_ECS_CLUSTER_NAME,
                service: serviceName,
                force: true,
            })
        )
        console.log(`[ECS Service] Deleted service: ${serviceName}`)
    } catch (error) {
        if (error.name === "ServiceNotFoundException" || error.name === "ClusterNotFoundException") {
            console.log(`[ECS Service] Service already gone: ${serviceName}`)
            return
        }
        throw error
    }
}
