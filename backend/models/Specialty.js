import mongoose from 'mongoose';
import slugify from 'slugify';

const specialtySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Specialty name is required'], unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug before save
specialtySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

specialtySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }
  next();
});

const Specialty = mongoose.model('Specialty', specialtySchema);
export default Specialty;
