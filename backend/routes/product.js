import express from 'express';
import { body } from 'express-validator';
import { getProducts, getProductBySlug, getProductById, createProduct, updateProduct, deleteProduct, getFeaturedProducts, getBrands, getSearchSuggestions, updateProductOfferStatus } from '../controllers/productController.js';
import { protect, adminProtect, optionalAuth } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/suggestions', getSearchSuggestions);
router.get('/featured', getFeaturedProducts);
router.get('/brands', getBrands);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.post('/', adminProtect, uploadMultiple, [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
], validate, createProduct);
router.put('/:id', adminProtect, uploadMultiple, [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
], validate, updateProduct);
router.delete('/:id', adminProtect, deleteProduct);
router.patch('/:id/offer', adminProtect, updateProductOfferStatus);

export default router;
