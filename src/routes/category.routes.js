import { Router } from 'express';
import { createCategory, deleteCategory, getCategory, listActiveCategories, listCategories, updateCategory } from '../controllers/categories.controller.js';
import { requireAuth } from '../middleware/auth.js';

const publicRouter = Router();
publicRouter.get('/', listActiveCategories);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get('/', listCategories);
adminRouter.post('/', createCategory);
adminRouter.get('/:id', getCategory);
adminRouter.put('/:id', updateCategory);
adminRouter.delete('/:id', deleteCategory);

export { publicRouter as publicCategoryRoutes, adminRouter as adminCategoryRoutes };
