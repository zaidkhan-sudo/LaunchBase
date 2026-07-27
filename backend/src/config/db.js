import mongoose from 'mongoose'
import config from './config.js'
async function connectDB(){
    try{
        const conn=await mongoose.connect(config.MONGO_URI);
        console.log(`[DB] MongoDB connected ${conn.connection.host}`)
    }catch(error){
        console.log(`[DB] MongoDB Connection error ${error.message}`)
        process.exit(1)
    }
}
export default connectDB