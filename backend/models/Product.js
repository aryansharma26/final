import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: [200, 'Name cannot exceed 200 characters'] },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '', trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true, trim: true },
  images: [{ url: String, public_id: String }],
  price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
  discountPrice: { type: Number, min: [0, 'Discount price cannot be negative'], default: 0 },
  stock: { type: Number, required: [true, 'Stock is required'], min: [0, 'Stock cannot be negative'], default: 0 },
  sku: { type: String, required: true, unique: true, trim: true },
  productInfo: { type: String, trim: true },
  keyIngredients: [{ type: String, trim: true }],
  otherIngredients: [{ type: String, trim: true }],
  benefits: [{ type: String }],
  goodToKnow: { type: String, trim: true },
  productForm: { type: String, trim: true },
  netQty: { type: String, trim: true },
  directionsForUse: { type: String, trim: true },
  safetyInfo: [{ type: String, trim: true }],
  quickTips: [{ type: String, trim: true }],
  faqs: [{
    question: { type: String, trim: true },
    answer: { type: String, trim: true },
  }],
  dosage: { type: String, trim: true },
  composition: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  isPrescriptionRequired: { type: Boolean, default: false },
  bulkPricing: [{
    minQty: { type: Number, required: true, min: 1 },
    maxQty: { type: Number, default: null },
    unitPrice: { type: Number, required: true, min: 0 },
    label: { type: String, trim: true },
  }],
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  showInOffers: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
  taxRate: { type: Number, default: 12, min: [0, 'Tax rate cannot be negative'] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('discountPercentage').get(function () {
  if (this.discountPrice > 0 && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set('toJSON', {
  transform: function (doc, ret) {
    // Backward compatibility: convert image objects to URL strings in JSON responses
    if (ret.images && Array.isArray(ret.images)) {
      ret.images = ret.images.map((img) => (typeof img === 'string' ? img : img?.url || ''));
    }
    return ret;
  },
});

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ priority: -1, createdAt: -1 });
productSchema.index({ isPopular: -1, priority: -1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
