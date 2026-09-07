import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import config from './config/config.js'
import authRouter from "./routes/auth.routes.js"
import projectRouter from './routes/project.routes.js'
import webhookRouter from './routes/webhook.routes.js'
import deploymentRouter from './routes/deployment.routes.js'

const app=express()

// CORS first so preflight OPTIONS requests short-circuit before body parsing.
// credentials:true is required for the httpOnly refreshToken cookie to survive
// cross-origin requests from the Vite dev server.
app.use(cors({
    origin:config.FRONTEND_URL,
    credentials:true
}))

// GitHub signs the raw request bytes, so keep a copy of the buffer before parsing.
// Re-stringifying the parsed object can change key order or unicode escaping and
// would fail a legitimate signature.
app.use(express.json({
    verify:(req,res,buf)=>{
        req.rawBody=buf
    }
}))
app.use(morgan('dev'))
app.use(cookieParser())

app.use("/api/auth",authRouter)
app.use("/api/project",projectRouter)
app.use('/api/webhook',webhookRouter)
app.use('/api/deployment',deploymentRouter)

app.get("/",(req,res)=>{
    res.status(200).json(
        {
            msg:"Vercel clone api running"
        }
    )
})

export default app
