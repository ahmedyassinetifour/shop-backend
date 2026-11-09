import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

function categoryInput(body, partial = false) {
  const input = {};
  if (!partial || Object.hasOwn(body, 'name')) input.name = body.name;
  if (!partial || Object.hasOwn(body, 'description')) input.description = body.description ?? '';
  if (!partial || Object.hasOwn(body, 'is_active')) input.is_active = body.is_active ?? true;
  if (!partial || Object.hasOwn(body, 'sort_order')) input.sort_order = body.sort_order ?? 0;

  if (input.name !== undefined && (typeof input.name !== 'string' || input.name.trim().length < 1 || input.name.trim().length > 100)) {
    return { error: 'Category name is required and must be at most 100 characters.' };
  }
  if (input.name !== undefined) input.name = input.name.trim();
  if (input.description !== undefined && (typeof input.description !== 'string' || input.description.length > 2000)) return { error: 'Description must be text up to 2000 characters.' };
  if (input.is_active !== undefined && typeof input.is_active !== 'boolean') return { error: 'is_active must be a boolean.' };
  if (input.sort_order !== undefined && (!Number.isInteger(input.sort_order) || input.sort_order < 0)) return { error: 'sort_order must be a non-negative integer.' };
  return { value: input };
}

export async function listActiveCategories(_req, res, next) {
  try { return res.json(await Category.find({ is_active: true }).sort({ sort_order: 1, name: 1 })); } catch (error) { return next(error); }
}

export async function listCategories(_req, res, next) {
  try {
    const categories = await Category.find().sort({ sort_order: 1, name: 1 }).lean();
    const counts = await Product.aggregate([
      { $match: { category_id: { $ne: null } } },
      { $group: { _id: '$category_id', products_count: { $sum: 1 } } },
    ]);
    const countByCategory = new Map(counts.map(({ _id, products_count }) => [_id.toString(), products_count]));
    return res.json(categories.map((category) => ({ ...category, id: category._id.toString(), products_count: countByCategory.get(category._id.toString()) || 0 })));
  } catch (error) { return next(error); }
}

export async function getCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid category ID.' });
    const category = await Category.findById(req.params.id);
    return category ? res.json(category) : res.status(404).json({ error: 'Category not found.' });
  } catch (error) { return next(error); }
}

export async function createCategory(req, res, next) {
  try {
    const parsed = categoryInput(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const category = await Category.create(parsed.value);
    return res.status(201).json(category);
  } catch (error) { return next(error); }
}

export async function updateCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid category ID.' });
    const parsed = categoryInput(req.body, true);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const category = await Category.findByIdAndUpdate(req.params.id, parsed.value, { new: true, runValidators: true });
    return category ? res.json(category) : res.status(404).json({ error: 'Category not found.' });
  } catch (error) { return next(error); }
}

export async function deleteCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid category ID.' });
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    await Product.updateMany({ category_id: category._id }, { $set: { category_id: null } });
    return res.status(200).json({ message: 'Category deleted.' });
  } catch (error) { return next(error); }
}
