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
  usageLimit: { type: Number, default: null },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  usedBy: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    validate: {
      validator: function (v) {
        const limit = this.usageLimit || 10000;
        return v.length <= limit;
      },
      message: 'Coupon user array has exceeded the configured usage limit',
    },
  },
}, { timestamps: true });

couponSchema.virtual('isNearCapacity').get(function () {
  const limit = this.usageLimit || 10000;
  return this.usedBy.length >= limit * 0.9;
});

couponSchema.index({ isActive: 1, endDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
