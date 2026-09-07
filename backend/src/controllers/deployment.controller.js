import Deployment from "../models/deployment.model.js"

/**
 * Fetch a single deployment including its full log history.
 *
 * This is the replay endpoint: the frontend calls it on mount to seed state, so
 * a page refresh mid-build (or a visit long after the build finished) renders the
 * complete stepper and log output before the socket stream takes over.
 */
async function handleGetDeploymentById(req, res) {
    try {
        const { deployment_id } = req.params

        // Filtering on owner (denormalized onto the deployment) avoids a populate
        // just to authorize the read.
        const deployment = await Deployment.findOne({
            _id: deployment_id,
            owner: req.user._id,
        }).populate("project", "name repoUrl branch liveUrl")

        if (!deployment) return res.status(404).json({ msg: "Deployment not found or unauthorized" })

        return res.status(200).json({
            msg: "Deployment successfully fetched",
            deployment,
        })
    } catch (error) {
        console.error("[Deployment error] handleGetDeploymentById failed", error)
        return res.status(500).json({ msg: error.message || "Internal server error fetching deployment" })
    }
}

export { handleGetDeploymentById }
