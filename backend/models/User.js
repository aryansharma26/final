import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [50, 'Name cannot exceed 50 characters'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  adminNotes: { type: String, trim: true, default: '' },
  tokenVersion: { type: Number, default: 0 },
  addresses: [{
    name: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    province: String,
    cityMunicipality: String,
    barangay: String,
    zipCode: String,
    country: { type: String, default: 'Philippines' },
    isDefault: { type: Boolean, default: false }
  }],
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  lastLogin: Date,
}, { timestamps: true });

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
