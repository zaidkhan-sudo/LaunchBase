import Project from "../models/project.js"
import Deployment from "../models/deployment.model.js"
import crypto from "crypto"
import { createDeployment } from "../services/deployment.service.js"
import { deleteListenerRuleByArn, deleteTargetGroupByArn } from "../services/alb.service.js"
import { deleteECSService } from "../services/ecs.service.js"

async function handleCreateProject(req, res) {
    try {
        const { name, repoUrl, branch } = req.body
        if (!name || !repoUrl) return res.status(400).json({ msg: "Project name and GitHub repo URL are required" })

        const trimmedName = name.toLowerCase().trim();
        const existingProject = await Project.findOne({ name: trimmedName })
        if (existingProject) return res.status(409).json({ msg: "Project name already exists. Please choose a unique name" })

        const webhookSecret = crypto.randomBytes(20).toString("hex")
        const project = await Project.create({
            name: trimmedName,
            owner: req.user._id,
            // Stored without a trailing .git so webhook lookups match consistently.
            repoUrl: repoUrl.trim().replace(/\.git$/, ""),
            branch: branch ? branch : "main",
            webhookSecret,
            status: "QUEUED"
        })

        let deployment
        try {
            deployment = await createDeployment({ project, trigger: "MANUAL" })
        } catch (error) {
            await Project.findByIdAndUpdate(project._id, { status: "FAILED" })
            throw error
        }

        return res.status(201).json(
            {
                msg: "Project created and queued for build successfully",
                project,
                // Returned so the client can navigate straight into the live build.
                deployment
            }
        )
    } catch (error) {
        console.error("[Project error] handleCreateProject failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error creating project" })
    }
}



async function handleGetUserProjects(req, res) {
    try {
        const projects = await Project.find({ owner: req.user._id }).sort({ createdAt: -1 })

        // Attach each project's most recent deployment so the dashboard can show
        // the last commit without an extra request per row.
        const projectIds = projects.map((p) => p._id)
        const latest = await Deployment.find({ project: { $in: projectIds } })
            .select("-logs")
            .sort({ createdAt: -1 })
            .lean()

        const latestByProject = new Map()
        for (const deployment of latest) {
            const key = String(deployment.project)
            if (!latestByProject.has(key)) latestByProject.set(key, deployment)
        }

        const withDeployments = projects.map((project) => ({
            ...project.toObject(),
            latestDeployment: latestByProject.get(String(project._id)) || null,
        }))

        return res.status(200).json(
            {
                msg: "Projects successfully fetched",
                projects: withDeployments,
            }
        )
    } catch (error) {
        console.error("[Project error] handleGetUsersProject failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error fetching projects" })
    }
}



async function handleGetProjectById(req, res) {
    try {
        const { project_id } = req.params
        const project = await Project.findOne({ _id: project_id, owner: req.user._id })
        if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" })

        const latestDeployment = await Deployment.findOne({ project: project._id })
            .select("-logs")
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json(
            {
                msg: "Project successfully fetched",
                project: {
                    ...project.toObject(),
                    latestDeployment: latestDeployment || null,
                },
            }
        )
    } catch (error) {
        console.error("[Project error] handleGetProjectById failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error fetching project" })
    }
}



/*
  How long to let the ECS service drain before deleting its target group.
  A target group still attached to a service cannot be deleted (ResourceInUse),
  and the service's own deregistration takes a few seconds even with the
  deregistration delay lowered to 5s.
*/
const DRAIN_WAIT_MS = 8 * 1000

/**
 * Release the AWS resources a project provisioned.
 *
 * Order is mandated by AWS — a target group in use by a service or referenced by
 * a rule cannot be deleted:
 *
 *   delete service (force) -> drain -> delete listener rule -> delete target group
 *
 * Deliberately never throws. An AWS failure here must not block the Mongo delete:
 * a leaked rule can be removed by hand from the console, but a project that
 * cannot be deleted is stuck in the user's dashboard forever. Returns the
 * warnings so the caller can report them.
 *
 * @returns {Promise<string[]>} human-readable warnings, empty when clean
 */
async function releaseProjectInfrastructure(project) {
    const warnings = []

    // Nothing was ever provisioned (ALB was off, or the build never reached DEPLOY).
    if (!project.ecsServiceArn && !project.albListenerRuleArn && !project.albTargetGroupArn) {
        return warnings
    }

    try {
        if (project.ecsServiceArn) {
            await deleteECSService(project.ecsServiceArn)
            // Only worth waiting if something was actually stopped.
            await new Promise((resolve) => setTimeout(resolve, DRAIN_WAIT_MS))
        }
    } catch (error) {
        console.error("[Project cleanup] Failed to delete ECS service:", error.message)
        warnings.push(`ECS service ${project.ecsServiceArn} may still be running`)
    }

    try {
        await deleteListenerRuleByArn(project.albListenerRuleArn)
    } catch (error) {
        console.error("[Project cleanup] Failed to delete listener rule:", error.message)
        warnings.push(`ALB listener rule ${project.albListenerRuleArn} was not removed`)
    }

    try {
        await deleteTargetGroupByArn(project.albTargetGroupArn)
    } catch (error) {
        console.error("[Project cleanup] Failed to delete target group:", error.message)
        warnings.push(`ALB target group ${project.albTargetGroupArn} was not removed`)
    }

    return warnings
}

async function handleDeleteProject(req, res) {
    try {
        const { project_id } = req.params

        /*
          Read before deleting: the ARNs needed for cleanup live on the document.
          findOneAndDelete would return them too, but the AWS teardown takes
          several seconds, and the project must not disappear from the dashboard
          while its container is still serving traffic.
        */
        const project = await Project.findOne({ _id: project_id, owner: req.user._id })
        if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" })

        const warnings = await releaseProjectInfrastructure(project)

        await Project.deleteOne({ _id: project._id })

        // Deployments are worthless without their project — remove them so logs
        // do not accumulate orphaned in the collection.
        await Deployment.deleteMany({ project: project._id })

        return res.status(200).json(
            {
                msg: "Project deleted Successfully",
                deletedProjectId: project._id,
                // Surfaced rather than swallowed: a leaked rule consumes one of
                // the listener's 100 slots and needs manual cleanup.
                ...(warnings.length > 0 && { warnings })
            }
        )
    } catch (error) {
        console.error("[Project error] handleDeleteProject failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error deleting project" })
    }
}



/**
 * Deployment history for a project. Logs are excluded — they can be thousands of
 * lines each, and the list view only needs status and commit metadata.
 */
async function handleGetProjectDeployments(req, res) {
    try {
        const { project_id } = req.params
        const project = await Project.findOne({ _id: project_id, owner: req.user._id }).select("_id")
        if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" })

        const deployments = await Deployment.find({ project: project._id })
            .select("-logs")
            .sort({ createdAt: -1 })
            .limit(30)

        return res.status(200).json(
            {
                msg: "Deployments successfully fetched",
                deployments
            }
        )
    } catch (error) {
        console.error("[Project error] handleGetProjectDeployments failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error fetching deployments" })
    }
}



/**
 * Trigger a fresh build of the current branch without needing a GitHub push.
 */
async function handleRedeployProject(req, res) {
    try {
        const { project_id } = req.params
        const project = await Project.findOne({ _id: project_id, owner: req.user._id })
        if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" })

        // Refuse to stack builds: the worker processes one job at a time, so a
        // second concurrent build would race on the same workspace directory.
        const active = await Deployment.findOne({
            project: project._id,
            status: { $in: ["QUEUED", "BUILDING", "DEPLOYING"] }
        }).select("_id")

        if (active) {
            return res.status(409).json({
                msg: "A deployment is already in progress for this project",
                deploymentId: active._id
            })
        }

        const deployment = await createDeployment({ project, trigger: "MANUAL" })

        project.status = "QUEUED"
        await project.save()

        return res.status(201).json(
            {
                msg: "Redeploy queued successfully",
                deployment
            }
        )
    } catch (error) {
        console.error("[Project error] handleRedeployProject failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error queueing redeploy" })
    }
}



export {
    handleCreateProject,
    handleGetUserProjects,
    handleGetProjectById,
    handleDeleteProject,
    handleGetProjectDeployments,
    handleRedeployProject
}
