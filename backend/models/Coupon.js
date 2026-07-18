import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number, default: null },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  perUserLimit: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  usageByUser: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    count: { type: Number, default: 0 },
  }],
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

couponSchema.virtual('isNearCapacity').get(function () {
  return false;
});

couponSchema.index({ isActive: 1, endDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
