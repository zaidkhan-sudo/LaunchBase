import { RegisterTaskDefinitionCommand, RunTaskCommand } from "@aws-sdk/client-ecs"
import { ecsClient } from "../config/aws.js"
import config from "../config/config.js"

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
                        name: "user-app-container",
                        image: ecrImageUri,
                        essential: true,
                        portMappings: [
                            {
                                containerPort: 8080,
                                hostPort: 8080,
                                protocol: "tcp"
                            }
                        ]
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
