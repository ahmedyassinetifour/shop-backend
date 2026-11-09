import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  price: { type: Number, required: true, min: 0 },
  previous_price: { type: Number, min: 0 },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  imageUrl: { type: String, required: true, trim: true, validate: { validator: (value) => /^https?:\/\//i.test(value), message: 'imageUrl must be an HTTP or HTTPS URL.' } },
  images: { type: [String], default: [] },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  featured: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

productSchema.set('toJSON', { transform: (_doc, ret) => {
  const category = ret.category_id;
  ret.category_id = category?._id?.toString() || category?.toString() || null;
  ret.category = category && typeof category === 'object' ? category.name : null;
  ret.id = ret._id.toString();
  return ret;
} });
export default mongoose.model('Product', productSchema);
