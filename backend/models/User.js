import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  gender: String,
  phone: String,
  dob: String, // Store as string in dd/mm/yyyy format
  password: String,
  rtmToken: String,  
  rtcToken: String
});
export default mongoose.model('User', UserSchema);
