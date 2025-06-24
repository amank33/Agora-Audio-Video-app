import mongoose from 'mongoose';
const HostSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  gender: String,
  phone: String,
  dob: String, // Store as string in dd/mm/yyyy format
  password: String,
  bio: String,
  rtmToken: String,
  rtcToken: String
});
export default mongoose.model('Host', HostSchema);
