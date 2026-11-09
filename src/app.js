import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import { adminCategoryRoutes, publicCategoryRoutes } from './routes/category.routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests. Try again later.' } }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/categories', publicCategoryRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
