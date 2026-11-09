import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, register } from '../controllers/auth.controller.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many login attempts. Try again in 15 minutes.' } });
router.post('/register', register);
router.post('/login', loginLimit, login);
export default router;
