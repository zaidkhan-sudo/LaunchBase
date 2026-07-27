import config from "../config/config.js"
import userModel from "../models/user.model.js"
import jwt from "jsonwebtoken"

async function handleMiddleware(req, res,next) {
    try {
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) return res.status(401).json({ msg: "Token not found" })

        const decoded = jwt.verify(token, config.JWT_SECRET)
        const user = await userModel.findById(decoded.id)
        if (!user) return res.status(404).json({ msg: "User not found" })
        req.user=user
        next()
    } catch (error) {
        console.error("[Middleware error] handleMiddleware failed")
        return res.status(401).json({msg:error.message || "Unauthorized access"})
    }
}
export default handleMiddleware