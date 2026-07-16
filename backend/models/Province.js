import mongoose from 'mongoose';
import slugify from 'slugify';

const provinceSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Province name is required'], trim: true },
  slug: { type: String, lowercase: true },
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Compound unique index: province name + region
provinceSchema.index({ name: 1, region: 1 }, { unique: true });

provinceSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

provinceSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.name) {
    const isPlainObject = !Object.keys(update).some(k => k.startsWith('$'));
    if (isPlainObject) {
      update.slug = slugify(update.name, { lower: true, strict: true });
    }
  }
  next();
});

const Province = mongoose.model('Province', provinceSchema);
export default Province;
