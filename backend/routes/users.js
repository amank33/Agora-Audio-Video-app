import express from 'express';
import User from '../models/User.js';
import Host from '../models/Host.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Get all users (for hosts)
router.get('/users', async (req, res) => {
  
  try {
    const users = await User.find({}); // Only return name and email
    res.status(201).json({users, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error', status: 'error' });
  }
});

// Get all hosts (for users)
router.get('/hosts', async (req, res) => {
  
  try {
    const hosts = await Host.find({}); // Return name, email, and bio
    res.status(201).json({ hosts, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error', status: 'error' });
  }
});

export default router;
