import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Host from '../models/Host.js';

const router = express.Router();

// Host signup
router.post('/signup/host', async (req, res) => {
  const { name, email, password, bio, gender, phone, dob } = req.body;

  // Regex patterns
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const genderRegex = /^(Male|Female|Other)$/i;
  const phoneRegex = /^\d{10,15}$/;
  const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  const passwordRegex = /^.{6,}$/;

  // Check for empty fields
  if (!name || !email || !password || !gender || !phone || !dob) {
    return res.status(400).json({ error: 'All fields are required.', status: 'error' });
  }

  // Validate fields
  if (!nameRegex.test(name)) {
    return res.status(400).json({ error: 'Invalid name.' , status: 'error'});
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email.', status: 'error'});
  }
  if (!genderRegex.test(gender)) {
    return res.status(400).json({ error: 'Invalid gender.', status: 'error' });
  }
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.', status: 'error' });
  }
  if (!dobRegex.test(dob)) {
    return res.status(400).json({ error: 'Invalid date of birth. Use dd/mm/yyyy.', status: 'error' });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.', status: 'error' });
  }

  const exists = await Host.findOne({ email,phone });
  if (exists) return res.status(409).json({ error: 'Email or phone number exists', status: 'error' });
  const hashed = await bcrypt.hash(password, 10);
  const host = new Host({ name, email, password: hashed, bio, gender, phone, dob });
  await host.save();
  res.status(201).json({ message: 'Host registered successfully',status: 'success' });
});

// User signup
router.post('/signup/user', async (req, res) => {
   const { name, email, password, bio, gender, phone, dob } = req.body;

  // Regex patterns
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const genderRegex = /^(Male|Female|Other)$/i;
  const phoneRegex = /^\d{10,15}$/;
  const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  const passwordRegex = /^.{6,}$/;

  // Check for empty fields
  if (!name || !email || !password || !gender || !phone || !dob) {
    return res.status(400).json({ error: 'All fields are required.', status: 'error' });
  }

  // Validate fields
  if (!nameRegex.test(name)) {
    return res.status(400).json({ error: 'Invalid name.' , status: 'error'});
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email.', status: 'error'});
  }
  if (!genderRegex.test(gender)) {
    return res.status(400).json({ error: 'Invalid gender.', status: 'error' });
  }
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.', status: 'error' });
  }
  if (!dobRegex.test(dob)) {
    return res.status(400).json({ error: 'Invalid date of birth. Use dd/mm/yyyy.', status: 'error' });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.', status: 'error' });
  }
  const exists = await User.findOne({ email,phone });
  if (exists) return res.status(409).json({ error: 'Email or phone number exists', status: 'error' });
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed, bio, gender, phone, dob });
  await user.save();
  res.status(201).json({ message: 'User registered successfully',status: 'success' });
});

router.post('/login/host', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Phone and password are required.', status: 'error' });
  }

  // Check if the input is an email or a phone
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const query = isEmail ? { email } : { phone: email };

  try {
    const host = await Host.findOne(query);
    if (!host || !(await bcrypt.compare(password, host.password))) {
      return res.status(401).json({ error: 'Invalid credentials', status: 'error' });
    }

    const token = jwt.sign({ id: host._id, type: 'host' }, process.env.JWT_SECRET);
    res.status(200).json({ data: host, token, name: host.name, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
});
router.post('/login/user', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Phone and password are required.', status: 'error' });
  }

  // Check if the input is an email or a phone
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const query = isEmail ? { email } : { phone: email };

  try {
    const user = await User.findOne(query);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials', status: 'error' });
    }

    const token = jwt.sign({ id: user._id, type: 'host' }, process.env.JWT_SECRET);
    res.status(200).json({ data: user, token, name: user.name, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
});



export default router;
