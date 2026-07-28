import Redis from 'ioredis'

const redisClient=new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379")

redisClient.on("connect",()=>{
    console.log("Connected to Redis successfully")
})
redisClient.on("error",()=>{
    console.log("Redis connection error")
})

export default redisClient