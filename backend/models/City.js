import mongoose from 'mongoose';
import slugify from 'slugify';

const citySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'City name is required'], trim: true },
  slug: { type: String, lowercase: true },
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Compound unique index: city name + province
citySchema.index({ name: 1, province: 1 }, { unique: true });

citySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

citySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.name) {
    const isPlainObject = !Object.keys(update).some(k => k.startsWith('$'));
    if (isPlainObject) {
      update.slug = slugify(update.name, { lower: true, strict: true });
    }
  }
  next();
});

const City = mongoose.model('City', citySchema);
export default City;
