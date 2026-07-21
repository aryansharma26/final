import express from 'express';
import { getB2BCategories, getB2BCategoryBySlug, createB2BCategory, updateB2BCategory, deleteB2BCategory } from '../controllers/b2bCategoryController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/all', adminProtect, getB2BCategories);
router.get('/', getB2BCategories);
router.get('/slug/:slug', getB2BCategoryBySlug);
router.post('/', adminProtect, createB2BCategory);
router.put('/:id', adminProtect, updateB2BCategory);
router.delete('/:id', adminProtect, deleteB2BCategory);

export default router;
