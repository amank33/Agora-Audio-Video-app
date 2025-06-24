import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  rtmToken: String
});
export default mongoose.model('User', UserSchema);
