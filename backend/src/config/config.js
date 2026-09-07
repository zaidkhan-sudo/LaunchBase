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
    // Defaulted rather than required so the server still boots without it in dev.
    FRONTEND_URL:process.env.FRONTEND_URL || "http://localhost:5173",
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
    AWS_VPC_SECURITY_GROUP_ID: process.env.AWS_VPC_SECURITY_GROUP_ID,

    /*
      ALB / subdomain routing (Day 13). All optional: an Application Load
      Balancer bills ~$16/month from the moment it exists, so the platform must
      stay fully functional without one. When these are absent the build still
      runs and deploys, `liveUrl` just stays null.

      - AWS_VPC_ID          required to create target groups
      - AWS_ALB_LISTENER_ARN the :80 listener that holds the host rules
      - PLATFORM_DOMAIN     wildcard-mapped to the ALB; <slug>.<domain> per project
      - AWS_ALB_ARN         only used to auto-discover the listener ARN
      - AWS_ALB_DNS_NAME    for building URLs and the nip.io fallback
    */
    AWS_VPC_ID: process.env.AWS_VPC_ID,
    AWS_ALB_ARN: process.env.AWS_ALB_ARN,
    AWS_ALB_LISTENER_ARN: process.env.AWS_ALB_LISTENER_ARN,
    AWS_ALB_DNS_NAME: process.env.AWS_ALB_DNS_NAME,
    PLATFORM_DOMAIN: process.env.PLATFORM_DOMAIN
}

/*
  One flag for the whole feature so callers don't re-check three vars and drift
  out of sync on which ones actually matter.
*/
const ALB_REQUIRED_KEYS = ["AWS_VPC_ID", "AWS_ALB_LISTENER_ARN", "PLATFORM_DOMAIN"]
const albMissing = ALB_REQUIRED_KEYS.filter((key) => !config[key])

config.ALB_ENABLED = albMissing.length === 0

/*
  Silent when the feature is fully on or fully off — both are valid. Only a
  half-configured ALB is worth shouting about, since that surfaces as an opaque
  AWS validation error much later, inside a build.
*/
if (albMissing.length > 0 && albMissing.length < ALB_REQUIRED_KEYS.length) {
    console.warn(
        `[Config] ALB routing disabled — missing ${albMissing.join(", ")}. ` +
        `Deployments will succeed but liveUrl will stay null.`
    )
}

export default config