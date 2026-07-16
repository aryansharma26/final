import slugify from 'slugify';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

let categoriesCache = null;
let categoriesCacheExpiry = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const invalidateCategoryCache = () => {
  categoriesCache = null;
  categoriesCacheExpiry = null;
};

const attachProductCounts = async (categories) => {
  const productCounts = await Product.aggregate([
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

      const parentCategory = await Category.findById(categoryData.parent);
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

export const getCategories = async (req, res, next) => {
  try {
    const isAdminRequest = Boolean(req.admin);

    if (isAdminRequest) {
      const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
      await attachProductCounts(categories);
      return res.json({ success: true, categories });
    }

    if (categoriesCache && categoriesCacheExpiry && Date.now() < categoriesCacheExpiry) {
      return res.json({ success: true, categories: categoriesCache });
    }

    const categories = await Category.find({ isActive: { $ne: false } }).sort({ order: 1, name: 1 }).lean();

    await attachProductCounts(categories);

    categoriesCache = categories;
    categoriesCacheExpiry = Date.now() + CACHE_TTL_MS;

    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const categoryData = await buildCategoryPayload(req.body);
    const category = await Category.create(categoryData);
    invalidateCategoryCache();
    res.status(201).json({ success: true, message: 'Category created', category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const categoryData = await buildCategoryPayload(req.body, req.params.id);
    const category = await Category.findByIdAndUpdate(req.params.id, categoryData, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    invalidateCategoryCache();
    res.json({ success: true, message: 'Category updated', category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const childCategories = await Category.find({ parent: category._id }).select('_id');
    const categoryIds = [category._id, ...childCategories.map((child) => child._id)];

    // Products are kept for audit/order history, but hidden when their category node is removed.
    await Product.updateMany({ category: { $in: categoryIds } }, { status: 'inactive' });
    await Category.deleteMany({ parent: category._id });
    await Category.findByIdAndDelete(req.params.id);
    invalidateCategoryCache();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
