import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
const dbCon = async ()=>{
    try {
        const dbCon = await mongoose.connect(process.env.MONGO_URI)
        console.log('Database connected...');
        
    } catch (error) {
        console.log('Database failed to connected ...!',error);
                
    }
}
export default dbCon
