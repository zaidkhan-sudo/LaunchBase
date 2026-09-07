import { Router } from 'express'
import { handleGetDeploymentById } from '../controllers/deployment.controller.js'
import handleMiddleware from '../middlewares/auth.middleware.js'

const deploymentRouter = Router()

deploymentRouter.get('/:deployment_id', handleMiddleware, handleGetDeploymentById)

export default deploymentRouter
