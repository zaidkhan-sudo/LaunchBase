import Project from "../models/project.js"
import crypto from "crypto"
import { pushToBuildQueue } from "../services/queue.service.js"

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
            repoUrl,
            branch: branch ? branch : "main",
            webhookSecret,
            status: "QUEUED"
        })
        try {
            await pushToBuildQueue(
                {
                    project_id: project._id,
                    repoUrl: project.repoUrl,
                    branch: project.branch
                }
            )
        }catch(error){
            await Project.findByIdAndUpdate(project._id,{status:"FAILED"})
            throw new Error("Failed to queue the build. Please try again.")
        }
        return res.status(201).json(
            {
                msg: "Project created and queued for build successfully",
                project
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
        return res.status(200).json(
            {
                msg: "Projects successfully fetched",
                projects,
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

        return res.status(200).json(
            {
                msg: "Project successfully fetched",
                project,
            }
        )
    } catch (error) {
        console.error("[Project error] handleGetProjectById failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error fetching project" })
    }
}



async function handleDeleteProject(req, res) {
    try {
        const { project_id } = req.params
        const project = await Project.findOneAndDelete({ _id: project_id, owner: req.user._id })
        if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" })
        return res.status(200).json(
            {
                msg: "Project deleted Successfully",
                deletedProjectId: project._id
            }
        )
    } catch (error) {
        console.error("[Project error] handleDeleteProject failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error deleting project" })
    }
}



export {
    handleCreateProject,
    handleGetUserProjects,
    handleGetProjectById,
    handleDeleteProject
}