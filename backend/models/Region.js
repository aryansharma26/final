import mongoose from 'mongoose';
import slugify from 'slugify';

const regionSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Region name is required'], unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

regionSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

regionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }
  next();
});

const Region = mongoose.model('Region', regionSchema);
export default Region;
