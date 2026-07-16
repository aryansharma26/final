import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  fileName: { type: String },
  fileType: { type: String, required: true },
  originalFileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String, default: '' },
  requestedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  deliveryAddress: {
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
  quoteStatus: { type: String, enum: ['none', 'sent', 'accepted'], default: 'none' },
  quoteItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  }],
  quoteNotes: { type: String, default: '' },
  quotedAt: Date,
  orderedAt: Date,
  uploadedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
}, { timestamps: true });

prescriptionSchema.index({ user: 1, status: 1 });
prescriptionSchema.index({ status: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
