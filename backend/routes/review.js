import express from 'express';
import { createReview, getProductReviews, getMyReviews, updateReview, deleteReview, getAllReviews, toggleReviewApproval, adminDeleteReview } from '../controllers/reviewController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.get('/my-reviews', protect, getMyReviews);
router.get('/', adminProtect, getAllReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/approve', adminProtect, toggleReviewApproval);
router.delete('/:id/admin', adminProtect, adminDeleteReview);

export default router;
