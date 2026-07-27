import {Router} from 'express'

import {
    handleCreateProject,
    handleGetUserProjects,
    handleGetProjectById,
    handleDeleteProject
} from "../controllers/project.controller.js"
import handleMiddleware from "../middlewares/auth.middleware.js"

const projectRouter = Router()

projectRouter.post('/',handleMiddleware,handleCreateProject)
projectRouter.get('/',handleMiddleware,handleGetUserProjects)
projectRouter.get('/:project_id',handleMiddleware,handleGetProjectById)
projectRouter.delete('/:project_id',handleMiddleware,handleDeleteProject)

export default projectRouter
