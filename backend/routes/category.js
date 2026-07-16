import express from 'express';
import { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/all', adminProtect, getCategories);
router.get('/', getCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.post('/', adminProtect, createCategory);
router.put('/:id', adminProtect, updateCategory);
router.delete('/:id', adminProtect, deleteCategory);

export default router;
