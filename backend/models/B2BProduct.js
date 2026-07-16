import mongoose from 'mongoose';

const b2bProductSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: [200, 'Name cannot exceed 200 characters'] },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '', trim: true },
  category: { type: String, trim: true },
  brand: { type: String, required: true, trim: true },
  images: [{ url: String, public_id: String }],
  // Bulk pricing tiers - main feature
  bulkPricing: [{
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, min: 0 },
    paymentUrl: { type: String, trim: true },
    label: { type: String, required: true, trim: true },
  }],
  // Stock availability
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true, unique: true, trim: true },
  // Product details
  productInfo: { type: String, trim: true },
  composition: { type: String, trim: true },
  dosage: { type: String, trim: true },
  productForm: { type: String, trim: true },
  netQty: { type: String, trim: true },
  directionsForUse: { type: String, trim: true },
  // Status
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  // Is prescription required
  isPrescriptionRequired: { type: Boolean, default: false },
  // Featured on B2B page
  featured: { type: Boolean, default: false },
  taxRate: { type: Number, default: 12, min: 0 },
  // Tags for filtering
  tags: [{ type: String }],
}, { timestamps: true });

b2bProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
b2bProductSchema.index({ category: 1, status: 1 });
b2bProductSchema.index({ featured: 1 });

const B2BProduct = mongoose.model('B2BProduct', b2bProductSchema);
export default B2BProduct;
