import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import agoraRoutes from './routes/agora.js';
import usersRoutes from './routes/users.js';
import hostsRoutes from './routes/hosts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {});
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/auth', authRoutes);
app.use('/agora', agoraRoutes);
app.use('/api', usersRoutes);
app.use('/api/hosts', hostsRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Upload directory: ${path.join(__dirname, 'uploads')}`);
});
