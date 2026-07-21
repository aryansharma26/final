import mongoose from 'mongoose';

const b2bCategorySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'B2BCategory', default: null },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

b2bCategorySchema.index({ parent: 1 });

const B2BCategory = mongoose.model('B2BCategory', b2bCategorySchema);
export default B2BCategory;
