import {ECRClient} from '@aws-sdk/client-ecr'
import {ECSClient} from '@aws-sdk/client-ecs'
import {ElasticLoadBalancingV2Client} from '@aws-sdk/client-elastic-load-balancing-v2'
import config from './config.js'

const awsConfig={
    region:config.AWS_REGION,
    credentials:{
        accessKeyId:config.AWS_ACCESS_KEY_ID,
        secretAccessKey:config.AWS_SECRET_ACCESS_KEY,
    },
}

const ecrClient=new ECRClient(awsConfig)
const ecsClient=new ECSClient(awsConfig)
// "V2" is the ELB API generation (ALB/NLB), not a package version.
const elbClient=new ElasticLoadBalancingV2Client(awsConfig)

export {
    ecrClient,
    ecsClient,
    elbClient
}