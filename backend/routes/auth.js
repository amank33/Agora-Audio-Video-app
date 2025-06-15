import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Host from '../models/Host.js';

const router = express.Router();

router.post('/signup/:type', async (req, res) => {
  const { name, email, password, bio } = req.body;
  const Model = req.params.type === 'host' ? Host : User;
  const exists = await Model.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email exists' });
  const hashed = await bcrypt.hash(password, 10);
  const doc = new Model({ name, email, password: hashed, ...(bio && { bio }) });
  await doc.save();
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
  res.json({ token, name: doc.name });
});

export default router;
