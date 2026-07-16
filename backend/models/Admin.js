import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['superadmin', 'admin', 'manager'], default: 'admin' },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

adminSchema.index({ role: 1 });

adminSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    const password = this.password;
    if (password.length < 8) {
      return next(new Error('Password must be at least 8 characters long'));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return next(new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'));
    }
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
