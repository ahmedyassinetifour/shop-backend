import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function createToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || name.trim().length < 2 || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Provide a name (at least 2 characters), valid email, and password (at least 8 characters).' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ error: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });
    return res.status(201).json({ message: 'Account created.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { return next(error); }
}

export async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    if (!email || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required.' });
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password.' });
    return res.status(200).json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { return next(error); }
}
