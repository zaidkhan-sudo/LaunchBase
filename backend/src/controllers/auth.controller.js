import userModel from "../models/user.model.js"
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from "../config/config.js"
import sessionModel from "../models/session.model.js"
import sendEmail from '../services/email.service.js' 
import { generateOtp,getOtpHtml } from "../utils/util.js"
import otpModel from "../models/otp.model.js"

async function  handleRegister(req,res){
    try {
        const {username,email,password,githubUsername}=req.body
        const isAlreaadyRegistered=await userModel.findOne({
            $or:[
                {username},
                {email},
            ]
        })
        if(isAlreaadyRegistered) return res.status(409).json({msg:"username or email already exists"})

        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)

        const user=await userModel.create({
            username,
            email,
            password:hashedPassword,
            githubUsername
        })

        const otp=generateOtp()
        const html=getOtpHtml(otp)
        
        const otpHash=crypto.createHash("sha256").update(otp).digest("hex")

        await otpModel.create({
            email,
            user:user._id,
            otpHash
        })
        await sendEmail(email,"OTP verification",`Your otp code is ${otp}`,html)


        res.status(201).json(
            {
                msg:"User successfully created",
                user:{
                    username:user.username,
                    email:user.email,
                    veified:user.verified
                },
            }
        )
    } catch (error) {
        console.error("[Auth Error] handleRegister failed:", error);
        return res.status(500).json({ msg: error.message || "Internal server error during registration" });
    }
}



async function handleLogin(req,res){
    try {
        const {email,password}=req.body
        if(!email || !password) return res.status(400).json({msg:"Please provide all the credentials"})
        
        const user=await userModel.findOne({email}).select("+password")
        if(!user) return res.status(401).json({msg:"Invalid credentials"})

        if(!user.verified) return res.status(401).json({msg:"Email not verified"})
        
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch) return res.status(401).json({msg:"Invalid credentials"})
        
        const refreshToken=jwt.sign(
            {
                id:user._id
            },
            config.JWT_SECRET,
            {
                expiresIn:"7d"
            }
        )
        const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")

        const session=await sessionModel.create({
            user:user._id,
            refreshTokenHash,
            ip:req.ip,
            userAgent:req.headers["user-agent"]
        })

        const accessToken=jwt.sign(
            {
                id:user._id,
                sessionId:session._id
            },
            config.JWT_SECRET,
            {
                expiresIn:"15m"
            }
        )


        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:7*24*60*60*1000
        })


        res.status(200).json(
            {
                msg:"Logged in successfully",
                user:{
                    username:user.username,
                    email:user.email
                },
                accessToken
            }
        )
    } catch (error) {
        console.error("[Auth Error] handleLogin failed:", error);
        return res.status(500).json({ msg: error.message || "Internal server error during login" });
    }
}



async function handleGetMe(req,res){
    try {
        return res.status(200).json(
            {
                msg:"User fetched successfully",
                user:req.user.username,
                email:req.user.email
            }
        )
    } catch (error) {
        console.error("[Auth Error] handleGetMe failed:", error);
        return res.status(500).json({ msg: error.message || "Internal server error" });
    }
}



async function handleRefreshToken(req,res){
    try {
        const refreshToken=req.cookies.refreshToken
        if(!refreshToken) return res.status(401).json({msg:"Refresh token not found"})
        
        const decoded=jwt.verify(refreshToken,config.JWT_SECRET)

        const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")
        const session=await sessionModel.findOne({
            refreshTokenHash,
            revoked:false
        })
        if(!session) return res.status(400).json({msg:"Invalid refresh token"})
        
        const accessToken=jwt.sign(
            {
                id:decoded.id,
                sessionId:session._id
            },
            config.JWT_SECRET,
            {
                expiresIn:"15m"
            }
        )

        const newRefreshToken=jwt.sign(
            {
                id:decoded.id
            },
            config.JWT_SECRET,
            {
                expiresIn:"7d"
            }
        )
        
        const newRefreshTokenHash=crypto.createHash("sha256").update(newRefreshToken).digest("hex")
        session.refreshTokenHash=newRefreshTokenHash
        await session.save()

        res.cookie("refreshToken",newRefreshToken,{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:7*24*60*60*1000
        })

        res.status(200).json({
            msg:"Access token refreshed successfully",
            accessToken
        })
    } catch (error) {
        console.error("[Auth Error] handleRefreshToken failed:", error);
        return res.status(500).json({ msg: error.message || "Internal server error" });
    }
}



async function handleLogOut(req,res){
    try {
        const refreshToken=req.cookies.refreshToken
        if(!refreshToken) return res.status(400).json({msg:"Refresh Token not found"})
        
        const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")

        const session=await sessionModel.findOne({
            refreshTokenHash,
            revoked:false
        })

        if(!session) return res.status(400).json({msg:"Invalid refresh token"})

        session.revoked=true
        await session.save()

        res.clearCookie("refreshToken")

        res.status(200).json({msg:"Logged Out successfully"})
    } catch (error) {
        console.error("[Auth Error] handleLogOut failed:", error);
        return res.status(500).json({ msg: error.message || "Internal server error" });
    }
}



async function handleLogoutAll(req,res){
    try {
        const refreshToken=req.cookies.refreshToken

        if(!refreshToken) return res.status(400).json({msg:"Refresh Token not Found"})
        
        const decoded=jwt.verify(refreshToken,config.JWT_SECRET)
        
        await sessionModel.updateMany(
            {
                user:decoded.id,
                revoked:false
            },
            {
                revoked:true
            }
        )

        res.clearCookie("refreshToken")

        res.status(200).json({msg:"Logged out from all devices successfully"})
    } catch (error) {
        console.error("[Auth Error] handleLogoutAll failed:", error);
        return res.status(500).json({ msg: error.message || "Internal server error" });
    }
}



async function handleVerifyEmail(req,res){
    try {
        const {otp,email}=req.body

        const otpHash=crypto.createHash("sha256").update(otp).digest("hex")

        const otpDoc=await otpModel.findOne({
            otpHash,
            email
        })

        if(!otpDoc) return res.status(400).json({msg:"Invalid otp"})

        const user=await userModel.findByIdAndUpdate(
            otpDoc.user,
            {
                verified:true
            },
            {
                new:true
            }
        )

        await otpModel.deleteMany({
            user:otpDoc.user
        })

        const refreshToken=jwt.sign(
            {
                id:user._id
            },
            config.JWT_SECRET,
            {
                expiresIn:"7d"
            }
        )
        const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")

        const session=await sessionModel.create({
            user:user._id,
            refreshTokenHash,
            ip:req.ip,
            userAgent:req.headers["user-agent"]
        })

        const accessToken=jwt.sign(
            {
                id:user._id,
                sessionId:session._id
            },
            config.JWT_SECRET,
            {
                expiresIn:"15m"
            }
        )


        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:7*24*60*60*1000
        })

        return res.status(200).json(
            {
                msg:"Email verified successfully",
                user:{
                    username:user.username,
                    email:user.email,
                    verified:user.verified
                }
            }
        )
    } catch (error) {
        console.error("[Auth Error] handleVerifyEmail failed:", error);
        return res.status(500).json({ msg: error.message || "Internal server error" });
    }
}


export {
    handleRegister,
    handleLogin,
    handleGetMe,
    handleRefreshToken,
    handleLogOut,
    handleLogoutAll,
    handleVerifyEmail,
}
