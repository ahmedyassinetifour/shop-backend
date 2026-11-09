import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

export async function listProducts(_req, res, next) {
  try { return res.json(await Product.find().populate('category_id').sort({ createdAt: 1 })); } catch (error) { return next(error); }
}

export async function getProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
    const product = await Product.findById(req.params.id).populate('category_id');
    return product ? res.json(product) : res.status(404).json({ error: 'Product not found.' });
  } catch (error) { return next(error); }
}

async function productInput(body, partial = false) {
  const input = { ...body };
  if (Object.hasOwn(input, 'category_id')) {
    if (input.category_id === null || input.category_id === '') input.category_id = null;
    else if (!mongoose.isValidObjectId(input.category_id) || !(await Category.exists({ _id: input.category_id }))) {
      return { error: 'category_id must reference an existing category.' };
    }
  } else if (Object.hasOwn(input, 'category')) {
    if (input.category === null || input.category === '') input.category_id = null;
    else if (typeof input.category !== 'string') return { error: 'category must be a category name.' };
    else {
      const escapedName = input.category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const category = await Category.findOne({ name: { $regex: `^${escapedName}$`, $options: 'i' } });
      if (!category) return { error: 'Category not found. Provide an existing category name or category_id.' };
      input.category_id = category._id;
    }
  } else if (!partial) {
    input.category_id = null;
  }
  delete input.category;
  if (!input.imageUrl && Array.isArray(input.images)) input.imageUrl = input.images[0];
  if (!input.images && input.imageUrl) input.images = [input.imageUrl];
  delete input.id;
  delete input._id;
  delete input.createdAt;
  delete input.updatedAt;
  return { value: input };
}

export async function createProduct(req, res, next) {
  try {
    const parsed = await productInput(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const product = await Product.create(parsed.value);
    await product.populate('category_id');
    return res.status(201).json(product);
  } catch (error) { return next(error); }
}

export async function updateProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
    const parsed = await productInput(req.body, true);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const product = await Product.findByIdAndUpdate(req.params.id, parsed.value, { new: true, runValidators: true }).populate('category_id');
    return product ? res.json(product) : res.status(404).json({ error: 'Product not found.' });
  } catch (error) { return next(error); }
}

export async function deleteProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
    const product = await Product.findByIdAndDelete(req.params.id);
    return product ? res.status(200).json({ message: 'Product deleted.' }) : res.status(404).json({ error: 'Product not found.' });
  } catch (error) { return next(error); }
}
