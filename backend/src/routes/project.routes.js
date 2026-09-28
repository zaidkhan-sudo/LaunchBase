import {Router} from 'express'

import {
    handleCreateProject,
    handleGetUserProjects,
    handleGetProjectById,
    handleDeleteProject,
    handleGetProjectDeployments,
    handleRedeployProject
} from "../controllers/project.controller.js"
import handleMiddleware from "../middlewares/auth.middleware.js"
import { requiredAdminDeployer } from '../middlewares/admin.middleware.js'

const projectRouter = Router()

projectRouter.post('/',handleMiddleware,requiredAdminDeployer,handleCreateProject)
projectRouter.get('/',handleMiddleware,handleGetUserProjects)
projectRouter.get('/:project_id',handleMiddleware,handleGetProjectById)
projectRouter.delete('/:project_id',handleMiddleware,requiredAdminDeployer,handleDeleteProject)
projectRouter.get('/:project_id/deployments',handleMiddleware,handleGetProjectDeployments)
projectRouter.post('/:project_id/redeploy',handleMiddleware,requiredAdminDeployer,handleRedeployProject)

export default projectRouter
