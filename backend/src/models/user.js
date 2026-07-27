import mongoose from 'mongoose'

const userSchema=new mongoose.Schema(
    {
        username:{
            type:String,
            required:[true,'username is required'],
            unique:true,
            trim:true,
            minLength:3,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        password:{
            type:String,
            required:[true,'password is required'],
            select:false,
            minLength:8,
        },
        verified:{
            type:Boolean,
            default:false,
        },
        githubUsername:{
            type:String,
            trim:true,
            default:null,
        }
    },
    {
        timestamps:true
    }
)
const User= mongoose.model('User',userSchema)
export default User