import slugify from 'slugify';
import B2BCategory from '../models/B2BCategory.js';
import B2BProduct from '../models/B2BProduct.js';

let b2bCategoriesCache = null;
let b2bCategoriesCacheExpiry = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const invalidateB2BCategoryCache = () => {
  b2bCategoriesCache = null;
  b2bCategoriesCacheExpiry = null;
};

const attachB2BProductCounts = async (categories) => {
  const productCounts = await B2BProduct.aggregate([
    { $match: { status: { $ne: 'inactive' } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  productCounts.forEach((pc) => { countMap[String(pc._id)] = pc.count; });

  categories.forEach((cat) => {
    let total = countMap[String(cat._id)] || 0;
    if (!cat.parent) {
      const subIds = categories
        .filter((c) => String(c.parent) === String(cat._id))
        .map((c) => String(c._id));
      subIds.forEach((sid) => { total += countMap[sid] || 0; });
    }
    cat.productCount = total;
  });

  return categories;
};

const normalizeParent = (parent) => {
  if (parent === undefined) return undefined;
  return parent || null;
};

const buildCategoryPayload = async (body, currentCategoryId = null) => {
  const categoryData = { ...body };
  delete categoryData.image;

  if (categoryData.name) {
    categoryData.slug = slugify(categoryData.name, { lower: true });
  }

  if (Object.prototype.hasOwnProperty.call(categoryData, 'parent')) {
    categoryData.parent = normalizeParent(categoryData.parent);

    if (categoryData.parent) {
      if (currentCategoryId && String(categoryData.parent) === String(currentCategoryId)) {
        const error = new Error('A category cannot be its own parent');
        error.statusCode = 400;
        throw error;
      }

      const parentCategory = await B2BCategory.findById(categoryData.parent);
      if (!parentCategory) {
        const error = new Error('Parent category not found');
        error.statusCode = 404;
        throw error;
      }

      if (parentCategory.parent) {
        const error = new Error('Only one subcategory level is supported');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  return categoryData;
};

export const getB2BCategories = async (req, res, next) => {
  try {
    const isAdminRequest = Boolean(req.admin);

    if (isAdminRequest) {
      const categories = await B2BCategory.find().sort({ order: 1, name: 1 }).lean();
      await attachB2BProductCounts(categories);
      return res.json({ success: true, categories });
    }

    if (b2bCategoriesCache && b2bCategoriesCacheExpiry && Date.now() < b2bCategoriesCacheExpiry) {
      return res.json({ success: true, categories: b2bCategoriesCache });
    }

    const categories = await B2BCategory.find({ isActive: { $ne: false } }).sort({ order: 1, name: 1 }).lean();

    await attachB2BProductCounts(categories);

    b2bCategoriesCache = categories;
    b2bCategoriesCacheExpiry = Date.now() + CACHE_TTL_MS;

    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const getB2BCategoryBySlug = async (req, res, next) => {
  try {
    const category = await B2BCategory.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'B2B Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

export const createB2BCategory = async (req, res, next) => {
  try {
    const categoryData = await buildCategoryPayload(req.body);
    const category = await B2BCategory.create(categoryData);
    invalidateB2BCategoryCache();
    res.status(201).json({ success: true, message: 'B2B Category created', category });
  } catch (error) {
    next(error);
  }
};

export const updateB2BCategory = async (req, res, next) => {
  try {
    const categoryData = await buildCategoryPayload(req.body, req.params.id);
    const category = await B2BCategory.findByIdAndUpdate(req.params.id, categoryData, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'B2B Category not found' });
    }
    invalidateB2BCategoryCache();
    res.json({ success: true, message: 'B2B Category updated', category });
  } catch (error) {
    next(error);
  }
};

export const deleteB2BCategory = async (req, res, next) => {
  try {
    const category = await B2BCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'B2B Category not found' });
    }

    const childCategories = await B2BCategory.find({ parent: category._id }).select('_id');
    const categoryIds = [category._id, ...childCategories.map((child) => child._id)];

    // B2B Products are hidden when their category is removed.
    await B2BProduct.updateMany({ category: { $in: categoryIds } }, { status: 'inactive' });
    await B2BCategory.deleteMany({ parent: category._id });
    await B2BCategory.findByIdAndDelete(req.params.id);
    invalidateB2BCategoryCache();
    res.json({ success: true, message: 'B2B Category deleted' });
  } catch (error) {
    next(error);
  }
};
