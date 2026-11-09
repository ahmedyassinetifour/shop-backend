import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100, unique: true },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0, min: 0, validate: Number.isInteger },
}, { timestamps: true, versionKey: false });

categorySchema.set('toJSON', { transform: (_doc, ret) => ({ ...ret, id: ret._id.toString() }) });
export default mongoose.model('Category', categorySchema);
