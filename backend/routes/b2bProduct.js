import express from 'express';
import { getAllB2BProducts, getB2BProductBySlug, createB2BProduct, updateB2BProduct, deleteB2BProduct, validateB2BProduct } from '../controllers/b2bProductController.js';
import { adminProtect } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllB2BProducts);
router.get('/:slug', getB2BProductBySlug);

// Admin routes
router.post('/', adminProtect, uploadMultiple, validateB2BProduct, createB2BProduct);
router.put('/:id', adminProtect, uploadMultiple, validateB2BProduct, updateB2BProduct);
router.delete('/:id', adminProtect, deleteB2BProduct);

export default router;
