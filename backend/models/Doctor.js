import mongoose from 'mongoose';
import slugify from 'slugify';
import crypto from 'crypto';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Doctor name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
  slug: { type: String, required: true, unique: true, lowercase: true },
  profilePhoto: { type: String, default: '' },
  specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
  hospitalClinic: { type: String, trim: true, default: '' },
  
  // Location hierarchy
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  
  // Address
  address: { type: String, trim: true, default: '' },
  
  // Contact
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  
  // Professional
  consultationFee: { type: Number, min: [0, 'Fee cannot be negative'], default: 0 },
  yearsOfExperience: { type: Number, min: [0, 'Experience cannot be negative'], default: 0 },
  
  // Availability
  availableDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  availableHours: { type: String, trim: true },
  
  // Features
  teleconsultation: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isEmergency: { type: Boolean, default: false },
  
  // Maps
  googleMapsUrl: { type: String, trim: true },
  
  // Ratings & Reviews (extensible for future reviews)
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // About
  about: { type: String, trim: true },
  education: { type: String, trim: true },
  
}, { timestamps: true });

// Auto-generate slug from name + city (to avoid collisions)
doctorSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    this.slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
  }
  next();
});

// Ensure slug is set for new documents (using pre-validate to set _id first)
doctorSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    // Use a temporary suffix if _id not yet set (pre-save will fix it)
    this.slug = baseSlug;
  }
  next();
});

doctorSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.name) {
    const baseSlug = slugify(update.name, { lower: true, strict: true });
    const query = this.getQuery();
    const idSuffix = query && query._id ? String(query._id).slice(-6) : crypto.randomUUID();
    update.slug = `${baseSlug}-${idSuffix}`;
  }
  next();
});

// Text index for search
doctorSchema.index({ name: 'text', hospitalClinic: 'text', address: 'text' });
// Query indexes
doctorSchema.index({ specialty: 1, isActive: 1 });
doctorSchema.index({ region: 1, province: 1, city: 1 });
doctorSchema.index({ isFeatured: 1, isActive: 1 });
doctorSchema.index({ isEmergency: 1, isActive: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ yearsOfExperience: -1 });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
