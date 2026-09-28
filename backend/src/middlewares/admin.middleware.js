import config from "../config/config.js";

export function requiredAdminDeployer(req,res,next){
    if(!req.user || !req.user.email) {
        return res.status(401).json({msg:"Authentication required"})
    }

    const userEmail=req.user.email.toLowerCase().trim()
    const isAllowed=config.ADMIN_EMAILS.includes(userEmail) //did this because ADMIN_EMAILS is an array 

    if(!isAllowed){
        return res.status(403).json(
            {
                msg:"Deployment and infrastructure actions are restricted to platform administrators to prevent AWS resource exhaustion in this demo environment. Feel free to explore existing projects and view deployment log replays.",
                code:"ADMIN_ONLY_ACTION"
            }
        )
    }

    next()

}
