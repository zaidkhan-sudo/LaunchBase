import simpleGit from "simple-git";
import { popFromBuildQueue } from "../services/queue.service.js";
import connectDB from "../config/db.js";
import Project from "../models/project.js";
import fs from "fs/promises";
import path from "path";


const git=simpleGit()

async function startWorker(){
    await connectDB()
    console.log("Build Worker started and waiting for tasks...")

    while(true){
        try{
            const job=await popFromBuildQueue()
            if(job) await processBuildJob(job)
        }catch(error){
            console.error("[Worker] Fatal error in worker loop:",error.message)
            await new Promise((resolve)=> setTimeout(resolve,3000))
        }
    }
}



async function processBuildJob(job){
    const {project_id,repoUrl,branch}=job
    const workspaceDir=path.resolve(process.cwd(),"workspace",project_id)
    try{
        console.log(`\n[Worker] Picked up job for project ${project_id}`)

        await Project.findByIdAndUpdate(project_id,{status:"BUILDING"})
        console.log(`[Worker] Status updated to Building`)

        await fs.mkdir(workspaceDir,{recursive:true})

        console.log(`[Worker] Cloning ${repoUrl} (branch:${branch}) into ${workspaceDir}`)
        await git.clone(repoUrl,workspaceDir,["--branch",branch ,"--depth","1"])
        console.log(`[Worker] Succesfully cloned project ${project_id}! Ready for Docker (Phase 3).`)
    }catch(error){
        console.error(`[Worker] Build/Clone failed for project ${project_id}`,error.message)
        await Project.findByIdAndUpdate(project_id,{status:"FAILED"})
    }
}


startWorker()