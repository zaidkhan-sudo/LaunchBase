import dotenv from 'dotenv'

dotenv.config()

if(!process.env.MONGO_URI) throw new Error("MONGO URI is not defined in enviornment variables")
if(!process.env.PORT) throw new Error("PORT is not defined in enviornment variables")
if(!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined in enviornment variables")
if(!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not defined in enviornment variables")
if(!process.env.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET is not defined in enviornment variables")
if(!process.env.GOOGLE_REFRESH_TOKEN) throw new Error("GOOGLE_REFRESH_TOKEN is not defined in enviornment variables")
if(!process.env.GOOGLE_USER) throw new Error("GOOGLE_USER is not defined in enviornment variables"  )
if(!process.env.AWS_ACCESS_KEY_ID) throw new Error("AWS_ACCESS_KEY_ID is not defined in environment variables")
if(!process.env.AWS_SECRET_ACCESS_KEY) throw new Error("AWS_SECRET_ACCESS_KEY is not defined in environment variables")
if(!process.env.AWS_REGION) throw new Error("AWS_REGION is not defined in environment variables")
if(!process.env.AWS_ACCOUNT_ID) throw new Error("AWS_ACCOUNT_ID is not defined in environment variables")


const config={
    MONGO_URI:process.env.MONGO_URI,
    PORT:process.env.PORT,
    JWT_SECRET:process.env.JWT_SECRET || "vercel_clone_secret_key_change_in_prod",
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN:process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER:process.env.GOOGLE_USER,
    
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || "ap-south-1",
    AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
    AWS_ECS_EXECUTION_ROLE_ARN: process.env.AWS_ECS_EXECUTION_ROLE_ARN,
    AWS_ECS_CLUSTER_NAME: process.env.AWS_ECS_CLUSTER_NAME || "vercel-clone-cluster",
    AWS_VPC_SUBNET_ID_1: process.env.AWS_VPC_SUBNET_ID_1,
    AWS_VPC_SUBNET_ID_2: process.env.AWS_VPC_SUBNET_ID_2,
    AWS_VPC_SECURITY_GROUP_ID: process.env.AWS_VPC_SECURITY_GROUP_ID
}
export default config