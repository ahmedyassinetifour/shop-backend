import 'dotenv/config';
import { connectDatabase } from '../config/database.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const sampleProducts = [
  { name: 'Linen Everyday Tote', description: 'A sturdy, soft-washed linen tote made for market mornings and everyday errands.', price: 2800, previous_price: 3400, stock: 12, featured: true, category: 'Bags', imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Hand-poured Ceramic Cup', description: 'A quietly beautiful stoneware cup with a warm, tactile glaze.', price: 1900, stock: 8, featured: true, category: 'Home', imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85' },
  { name: 'Sandalwood Candle', description: 'A slow-burning soy candle with notes of sandalwood, cedar, and soft amber.', price: 2200, stock: 18, featured: true, category: 'Rituals', imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85' },
  { name: 'Organic Cotton Throw', description: 'Textured organic cotton for slow mornings, reading corners, and cool evenings.', price: 5600, stock: 5, featured: false, category: 'Home', imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85' },
  { name: 'Botanical Hand Soap', description: 'Gentle liquid soap scented with rosemary and wild mint.', price: 1200, stock: 24, featured: false, category: 'Rituals', imageUrl: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=900&q=85' },
  { name: 'Woven Market Basket', description: 'A lightweight woven basket with generous room for a day out.', price: 4200, stock: 7, featured: false, category: 'Bags', imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85' },
];

await connectDatabase();
const categoryNames = [...new Set(sampleProducts.map(({ category }) => category))];
const categoryIds = new Map();
for (const [sort_order, name] of categoryNames.entries()) {
  const category = await Category.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, description: '', is_active: true, sort_order } },
    { new: true, upsert: true, runValidators: true },
  );
  categoryIds.set(name, category._id);
}

await Product.bulkWrite(sampleProducts.map(({ category, ...product }) => ({
  updateOne: {
    filter: { name: product.name },
    update: {
      $set: { ...product, category_id: categoryIds.get(category), images: [product.imageUrl] },
      $unset: { category: 1 },
    },
    upsert: true,
  },
})));
await Product.collection.updateMany({}, { $unset: { category: '' } });
console.log(`Seeded ${sampleProducts.length} sample products.`);
await mongoose.disconnect();
