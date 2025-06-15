import express from 'express';
import User from '../models/User.js';
import Host from '../models/Host.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Get all users (for hosts)
router.get('/users', authenticate, async (req, res) => {
  if (req.user.type !== 'host') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const users = await User.find({}, 'name email'); // Only return name and email
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all hosts (for users)
router.get('/hosts', authenticate, async (req, res) => {
  if (req.user.type !== 'user') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const hosts = await Host.find({}, 'name email bio'); // Return name, email, and bio
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
