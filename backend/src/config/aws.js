import {ECRClient} from '@aws-sdk/client-ecr'
import {ECSClient} from '@aws-sdk/client-ecs'
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

export {
    ecrClient,
    ecsClient
}