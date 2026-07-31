import {Router} from 'express'
import { handleGitHubWebhook } from '../controllers/webhook.controller.js'

const webhookRouter=Router()
webhookRouter.post('/github',handleGitHubWebhook)
export default webhookRouter