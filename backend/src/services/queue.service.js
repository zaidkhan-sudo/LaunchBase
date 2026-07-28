import redisClient from "../config/redis";


const queueName="build-queue"

async function pushToBuildQueue(jobData){
    try{
        const stringifiedData=JSON.stringify(jobData)
        await redisClient.lpush(queueName,stringifiedData)
        console.log(`[Queue] Job queued for project : ${jobData.project_id}`)
    }catch(error){
        console.error("[Queue] Error pushing to build queue",error.message)
        throw error
    }
}



async function popFromBuildQueue(){
    try{
        const result=await redisClient.brpop(queueName,0);
        if(!result) return null
        const stringifiedData=result[1]
        return JSON.parse(stringifiedData)
    }catch(error){
        console.error("[Queue] Error popping from build queue",error.message)
        return null
    }
}


export {
    pushToBuildQueue,
    popFromBuildQueue,
}