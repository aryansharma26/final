import mongoose from 'mongoose';
import slugify from 'slugify';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import { invalidateCategoryCache } from './categoryController.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const escapeRegex = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getSearchTokens = (search) => String(search || '').trim().split(/\s+/).filter(Boolean).slice(0, 6);
const activeStatusQuery = { $or: [{ status: 'active' }, { status: { $exists: false } }] };
const getSearchFields = (token) => {
  const fields = ['name', 'brand', 'tags', 'sku', 'searchKeywords'];
  if (String(token).length >= 4) {
    fields.push('description', 'composition');
  }
  return fields;
};
const getSuggestionSearchFields = () => ['name', 'brand', 'tags', 'sku', 'searchKeywords'];
const getWordStartRegex = (token) => new RegExp(`(^|[\\s\\-/])${escapeRegex(token)}`, 'i');
const uniqueObjectIds = (ids) => [...new Set(ids.filter(Boolean).map((id) => String(id)))];
const arrayFields = ['benefits', 'keyIngredients', 'otherIngredients', 'safetyInfo', 'quickTips', 'tags', 'searchKeywords'];
const categoryPopulate = {
  path: 'category',
  select: 'name slug parent',
  populate: { path: 'parent', select: 'name slug' },
};

const normalizeTextArray = (value) => {
  if (value === undefined || value === null) return undefined;
  const values = Array.isArray(value) ? value : String(value).split(/\r?\n|,/);
  return values.map((item) => String(item).trim()).filter(Boolean);
};

const normalizeFaqs = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      return parsed
        .map((faq) => ({
          question: String(faq?.question || '').trim(),
          answer: String(faq?.answer || '').trim(),
        }))
        .filter((faq) => faq.question && faq.answer);
    }
  } catch {
    // Fall through to line parser.
  }

  return String(value)
    .split(/\r?\n/)
    .map((line) => {
      const [question, ...answerParts] = line.split('|');
      return {
        question: String(question || '').trim(),
        answer: answerParts.join('|').trim(),
      };
    })
    .filter((faq) => faq.question && faq.answer);
};

const normalizeProductPayload = (payload) => {
  const productData = { ...payload };
  arrayFields.forEach((field) => {
    const normalized = normalizeTextArray(productData[field]);
    if (normalized !== undefined) productData[field] = normalized;
  });
  const faqs = normalizeFaqs(productData.faqs);
  if (faqs !== undefined) productData.faqs = faqs;
  if (typeof productData.bulkPricing === 'string') {
    try {
      productData.bulkPricing = JSON.parse(productData.bulkPricing);
    } catch {
      productData.bulkPricing = [];
    }
  }
  if (productData.showInOffers !== undefined) {
    productData.showInOffers = String(productData.showInOffers) === 'true';
  }
  if (productData.featured !== undefined) {
    productData.featured = String(productData.featured) === 'true';
  }
  if (productData.isPopular !== undefined) {
    productData.isPopular = String(productData.isPopular) === 'true';
  }
  if (productData.priority !== undefined) {
    productData.priority = Number(productData.priority) || 0;
  }
  return productData;
};

const findMatchingCategoryIds = async (search, limit = 8) => {
  const tokens = getSearchTokens(search);
  if (tokens.length === 0) return [];

  const categories = await Category.find({
    isActive: { $ne: false },
    $and: tokens.map((token) => ({ name: getWordStartRegex(token) })),
  })
    .select('_id parent name')
    .limit(limit);

  if (categories.length === 0) return [];

  const parentIds = categories.filter((category) => !category.parent).map((category) => category._id);
  const childCategories = parentIds.length > 0
    ? await Category.find({ parent: { $in: parentIds }, isActive: { $ne: false } }).select('_id')
    : [];

  return uniqueObjectIds([
    ...categories.map((category) => category._id),
    ...childCategories.map((category) => category._id),
  ]);
};

export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search, category, brand, minPrice, maxPrice, sort, status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    } else if (status !== 'all') {
      query.$or = [{ status: 'active' }, { status: { $exists: false } }];
    }
    if (search) {
      const tokens = getSearchTokens(search);
      if (tokens.length > 0) {
        const productSearchQuery = {
          $and: tokens.map((token) => {
            const regex = new RegExp(escapeRegex(token), 'i');
            return {
              $or: getSearchFields(token).map((field) => ({ [field]: regex })),
            };
          }),
        };
        const matchingCategoryIds = await findMatchingCategoryIds(search);
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            productSearchQuery,
            ...(matchingCategoryIds.length > 0 ? [{ category: { $in: matchingCategoryIds } }] : []),
          ],
        });
      }
    }
    if (category) {
      const catDoc = await Category.findById(category);
      if (catDoc && !catDoc.parent) {
        const subcats = await Category.find({ parent: category }).select('_id');
        const catIds = [category, ...subcats.map((c) => c._id.toString())];
        query.category = { $in: catIds };
      } else {
        query.category = category;
      }
    }
    if (brand) query.brand = new RegExp(escapeRegex(brand), 'i');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (req.query.discount) {
      query.showInOffers = true;
    }
    let sortOption = {};
    if (sort === 'price_asc') sortOption.price = 1;
    else if (sort === 'price_desc') sortOption.price = -1;
    else if (sort === 'rating') sortOption.rating = -1;
    else if (sort === 'newest') sortOption.createdAt = -1;
    else {
      sortOption.priority = -1;
      sortOption.createdAt = -1;
    }

    if (req.query.popular) {
      sortOption = { isPopular: -1, ...sortOption };
    }

    const isExport = req.query.export === 'true';
    const limitNum = isExport ? 10000 : Math.max(1, Math.min(10000, Number(limit) || 12));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = isExport ? 0 : (pageNum - 1) * limitNum;
    const products = await Product.find(query)
      .populate(categoryPopulate)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    const total = await Product.countDocuments(query);
    res.json({
      success: true,
      products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

export const getSearchSuggestions = async (req, res, next) => {
  try {
    const search = String(req.query.q || '').trim();
    if (search.length < 1) {
      return res.json({ success: true, products: [], brands: [], categories: [] });
    }

    const tokens = getSearchTokens(search);
    const normalizedSearch = search.toLowerCase();
    const productTextQuery = {
      $and: tokens.map((token) => {
        const regex = getWordStartRegex(token);
        return {
          $or: getSuggestionSearchFields().map((field) => ({ [field]: regex })),
        };
      }),
    };

    const categoryRegex = new RegExp(escapeRegex(search), 'i');
    const categories = await Category.find({
      isActive: { $ne: false },
      $and: tokens.map((token) => ({ name: getWordStartRegex(token) })),
    })
      .select('name slug parent order')
      .limit(12);

    const scoreCategory = (category) => {
      const name = String(category.name || '').toLowerCase();
      if (name === normalizedSearch) return 100;
      if (name.startsWith(normalizedSearch)) return 80;
      if (name.split(/[\s\-/]+/).some((word) => word.startsWith(normalizedSearch))) return 70;
      if (name.includes(normalizedSearch)) return 50;
      return 10;
    };

    categories.sort(
      (a, b) =>
        scoreCategory(b) - scoreCategory(a) ||
        (Number(a.order) || 0) - (Number(b.order) || 0) ||
        String(a.name).localeCompare(String(b.name))
    );

    const matchedCategoryIds = await findMatchingCategoryIds(search);
    const productQuery = {
      $and: [
        activeStatusQuery,
        {
          $or: [
            productTextQuery,
            ...(matchedCategoryIds.length > 0 ? [{ category: { $in: matchedCategoryIds } }] : []),
          ],
        },
      ],
    };

    const products = await Product.find(productQuery)
      .select('name slug brand sku tags images price discountPrice category')
      .populate({ path: 'category', select: 'name slug parent' })
      .limit(30);

    const scoreProduct = (product) => {
      const name = String(product.name || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      const sku = String(product.sku || '').toLowerCase();
      const tags = (product.tags || []).map((tag) => String(tag || '').toLowerCase());
      const categoryName = String(product.category?.name || '').toLowerCase();

      if (name === normalizedSearch || brand === normalizedSearch || sku === normalizedSearch) return 120;
      if (name.startsWith(normalizedSearch) || brand.startsWith(normalizedSearch)) return 100;
      if (tags.some((tag) => tag === normalizedSearch || tag.startsWith(normalizedSearch))) return 90;
      if (categoryName === normalizedSearch || categoryName.startsWith(normalizedSearch)) return 80;
      if (name.split(/[\s\-/]+/).some((word) => word.startsWith(normalizedSearch))) return 70;
      if (brand.split(/[\s\-/]+/).some((word) => word.startsWith(normalizedSearch))) return 60;
      return 30;
    };

    products.sort((a, b) => scoreProduct(b) - scoreProduct(a) || String(a.name).localeCompare(String(b.name)));

    const brands = await Product.distinct('brand', {
      ...activeStatusQuery,
      brand: categoryRegex,
    });

    res.json({
      success: true,
      products: products.slice(0, 8),
      brands: brands.slice(0, 5),
      categories: categories.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      $or: [{ status: 'active' }, { status: { $exists: false } }],
    }).populate(categoryPopulate);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    const similarQuery = {
      _id: { $ne: product._id },
      $and: [
        activeStatusQuery,
        {
          $or: [
            { category: product.category?._id || product.category },
            ...(product.brand ? [{ brand: new RegExp(`^${escapeRegex(product.brand)}$`, 'i') }] : []),
            ...(product.tags?.length ? [{ tags: { $in: product.tags } }] : []),
          ],
        },
      ],
    };
    const similarProducts = await Product.find(similarQuery)
      .populate(categoryPopulate)
      .sort({ featured: -1, rating: -1, createdAt: -1 })
      .limit(8);
    res.json({ success: true, product, reviews, similarProducts });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const product = await Product.findById(req.params.id).populate(categoryPopulate);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = normalizeProductPayload({ ...req.body, slug: slugify(req.body.name, { lower: true }) });
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ success: false, message: 'Image uploads are currently unavailable. Cloudinary is not configured.' });
      }
      const uploadPromises = req.files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
        const result = await cloudinary.uploader.upload(dataURI, { folder: 'capsandpills/products' });
        return { url: result.secure_url, public_id: result.public_id };
      });
      productData.images = await Promise.all(uploadPromises);
    }
    const product = await Product.create(productData);
    invalidateCategoryCache();
    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  let uploadedImages = [];
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const existingProduct = await Product.findById(req.params.id).select('images');
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const productData = normalizeProductPayload(req.body);
    if (req.body.name) {
      productData.slug = slugify(req.body.name, { lower: true });
    }
    if (req.body.existingImages && (!req.files || req.files.length === 0)) {
      try {
        const existing = JSON.parse(req.body.existingImages);
        if (Array.isArray(existing)) {
          productData.images = existing.map((img) =>
            typeof img === 'string' ? { url: img } : img
          );
        }
      } catch {
        // ignore invalid JSON
      }
    }
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ success: false, message: 'Image uploads are currently unavailable. Cloudinary is not configured.' });
      }
      const uploadPromises = req.files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
        const result = await cloudinary.uploader.upload(dataURI, { folder: 'capsandpills/products' });
        return { url: result.secure_url, public_id: result.public_id };
      });
      uploadedImages = await Promise.all(uploadPromises);
      productData.images = uploadedImages;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (Array.isArray(productData.images)) {
      const nextPublicIds = new Set(productData.images.map((img) => img?.public_id).filter(Boolean));
      const removedImages = (existingProduct.images || []).filter((img) => img?.public_id && !nextPublicIds.has(img.public_id));
      if (removedImages.length > 0) {
        await Promise.allSettled(removedImages.map((img) => cloudinary.uploader.destroy(img.public_id)));
      }
    }
    invalidateCategoryCache();
    res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    if (uploadedImages.length > 0) {
      await Promise.allSettled(uploadedImages.map((img) => img?.public_id && cloudinary.uploader.destroy(img.public_id)));
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ product: req.params.id });
    invalidateCategoryCache();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      featured: true,
      $or: [{ status: 'active' }, { status: { $exists: false } }],
    })
      .populate(categoryPopulate)
      .limit(8)
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', {
      $or: [{ status: 'active' }, { status: { $exists: false } }],
    });
    res.json({ success: true, brands });
  } catch (error) {
    next(error);
  }
};

export const updateProductOfferStatus = async (req, res, next) => {
  try {
    const { showInOffers } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { showInOffers: String(showInOffers) === 'true' },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product offer status updated', product });
  } catch (error) {
    next(error);
  }
};
