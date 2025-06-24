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
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Validate fields
  if (!nameRegex.test(name)) {
    return res.status(400).json({ error: 'Invalid name.' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email.' });
  }
  if (!genderRegex.test(gender)) {
    return res.status(400).json({ error: 'Invalid gender.' });
  }
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }
  if (!dobRegex.test(dob)) {
    return res.status(400).json({ error: 'Invalid date of birth. Use dd/mm/yyyy.' });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const exists = await Host.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email exists' });
  const hashed = await bcrypt.hash(password, 10);
  const host = new Host({ name, email, password: hashed, bio, gender, phone, dob });
  await host.save();
  res.sendStatus(201);
});

// User signup
router.post('/signup/user', async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();
  res.sendStatus(201);
});

router.post('/login/:type', async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const Model = req.params.type === 'host' ? Host : User;
  console.log(Model);
  console.log(req.params.type);
  const doc = await Model.findOne({ email });
  console.log(doc);
  if (!doc || !(await bcrypt.compare(password, doc.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: doc._id, type: req.params.type }, process.env.JWT_SECRET);
  res.json({ data:doc, token, name: doc.name });
});

export default router;
