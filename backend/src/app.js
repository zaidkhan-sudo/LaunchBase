import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from "./routes/auth.routes.js"
import projectRouter from './routes/project.routes.js'

const app=express()
app.use(express.json())
app.use(morgan('dev')) 
app.use(cors())
app.use(cookieParser())

app.use("/api/auth",authRouter)
app.use("/api/project",projectRouter)

app.get("/",(req,res)=>{
    res.status(200).json(
        {
            msg:"Vercel clone api running"
        }
    )
})

export default app 