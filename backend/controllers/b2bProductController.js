import B2BProduct from '../models/B2BProduct.js';
import { body, validationResult } from 'express-validator';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

export const validateB2BProduct = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required (max 200 chars)').escape(),
  body('description').optional({ checkFalsy: true }).trim().escape(),
  body('brand').trim().isLength({ min: 1 }).withMessage('Brand is required').escape(),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sku').trim().isLength({ min: 1 }).withMessage('SKU is required').escape(),
];

export const getAllB2BProducts = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { search, category, status, featured, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { tags: searchRegex }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;
    if (featured === 'true') query.featured = true;

    const skip = (Number(page) - 1) * Number(limit);
    const products = await B2BProduct.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await B2BProduct.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getB2BProductBySlug = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const product = await B2BProduct.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).json({ success: false, message: 'B2B Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const createB2BProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const productData = { ...req.body };

    // Auto-generate slug if not provided
    if (!productData.slug && productData.name) {
      productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Parse bulkPricing if sent as JSON string
    if (typeof productData.bulkPricing === 'string') {
      productData.bulkPricing = JSON.parse(productData.bulkPricing);
    }

    // Handle images - Cloudinary upload
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ success: false, message: 'Image uploads are currently unavailable. Cloudinary is not configured.' });
      }
      const uploadPromises = req.files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
        const result = await cloudinary.uploader.upload(dataURI, { folder: 'capsandpills/b2b-products' });
        return { url: result.secure_url, public_id: result.public_id };
      });
      productData.images = await Promise.all(uploadPromises);
    }

    const product = await B2BProduct.create(productData);
    res.status(201).json({ success: true, message: 'B2B Product created', product });
  } catch (error) {
    next(error);
  }
};

export const updateB2BProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const productData = { ...req.body };

    // Parse bulkPricing if sent as JSON string
    if (typeof productData.bulkPricing === 'string') {
      productData.bulkPricing = JSON.parse(productData.bulkPricing);
    }

    // Handle images - Cloudinary upload
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ success: false, message: 'Image uploads are currently unavailable. Cloudinary is not configured.' });
      }
      const uploadPromises = req.files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
        const result = await cloudinary.uploader.upload(dataURI, { folder: 'capsandpills/b2b-products' });
        return { url: result.secure_url, public_id: result.public_id };
      });
      productData.images = await Promise.all(uploadPromises);
    } else if (req.body.existingImages) {
      try {
        const existing = JSON.parse(req.body.existingImages);
        if (Array.isArray(existing) && existing.length > 0) {
          productData.images = existing.map((img) =>
            typeof img === 'string' ? { url: img } : img
          );
        }
      } catch {
        // ignore invalid JSON
      }
    }

    const product = await B2BProduct.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'B2B Product not found' });
    }
    res.json({ success: true, message: 'B2B Product updated', product });
  } catch (error) {
    next(error);
  }
};

export const deleteB2BProduct = async (req, res, next) => {
  try {
    const product = await B2BProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'B2B Product not found' });
    }
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }
    await B2BProduct.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'B2B Product deleted' });
  } catch (error) {
    next(error);
  }
};
