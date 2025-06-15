import mongoose from 'mongoose';
const HostSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  bio: String
});
export default mongoose.model('Host', HostSchema);
