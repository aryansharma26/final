import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  name: { type: String, required: true },
  image: { type: String },
  productSlug: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  quantity: { type: Number, required: true },
  isB2B: { type: Boolean, default: false },
  tierLabel: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [orderItemSchema],
  isB2B: { type: Boolean, default: false },
  isPrescriptionOrder: { type: Boolean, default: false },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', default: null },
  shippingAddress: {
    name: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    province: String,
    cityMunicipality: String,
    barangay: String,
    zipCode: String,
    country: { type: String, default: 'Philippines' },
  },
  paymentMethod: { type: String, enum: ['cod'], required: true },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String,
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  couponDiscount: { type: Number, default: 0.0 },
  seniorDiscount: { type: Number, default: 0.0 },
  checkoutOfferDiscount: { type: Number, default: 0.0 },
  coupon: { type: mongoose.Schema.Types.ObjectId, refPath: 'couponModel', default: null },
  couponModel: { type: String, enum: ['Coupon', 'B2BCoupon'], default: 'Coupon' },
  isSeniorCitizen: { type: Boolean, default: false },
  seniorCitizenIdDoc: { type: String, default: '' },
  seniorCitizenStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  totalPrice: { type: Number, required: true, default: 0.0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
  trackingNumber: { type: String },
  notes: { type: String },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ isPaid: 1, createdAt: -1 });

orderSchema.pre('save', function (next) {
  // taxPrice is inclusive of itemsPrice, so it should not be added to totalPrice.
  this.totalPrice = Math.max(0, this.itemsPrice + this.shippingPrice - (this.couponDiscount || 0) - (this.seniorDiscount || 0) - (this.checkoutOfferDiscount || 0));
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
