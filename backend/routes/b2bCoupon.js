import express from 'express';
import { body } from 'express-validator';
import { protect, adminProtect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getB2BCoupons,
  getActiveB2BCoupons,
  createB2BCoupon,
  updateB2BCoupon,
  deleteB2BCoupon,
  validateB2BCoupon,
} from '../controllers/b2bCouponController.js';

const router = express.Router();

const createValidation = [
  body('code').trim().notEmpty().withMessage('B2B coupon code is required').isLength({ max: 40 }).withMessage('B2B coupon code is too long'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 300 }).withMessage('Description is too long'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be zero or greater'),
  body('minOrderAmount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Minimum order amount must be zero or greater'),
  body('maxDiscountAmount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Maximum discount amount must be zero or greater'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').isISO8601().withMessage('End date is required'),
  body('perUserLimit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Per user limit must be at least 1'),
  body('usageLimit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Per user limit must be at least 1'),
  body('isActive').optional().isBoolean().withMessage('Active status must be true or false'),
];

const updateValidation = [
  body('code').optional().trim().notEmpty().withMessage('B2B coupon code cannot be empty').isLength({ max: 40 }).withMessage('B2B coupon code is too long'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 300 }).withMessage('Description is too long'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').optional().isFloat({ min: 0 }).withMessage('Discount value must be zero or greater'),
  body('minOrderAmount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Minimum order amount must be zero or greater'),
  body('maxDiscountAmount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Maximum discount amount must be zero or greater'),
  body('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  body('endDate').optional().isISO8601().withMessage('End date must be valid'),
  body('perUserLimit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Per user limit must be at least 1'),
  body('usageLimit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Per user limit must be at least 1'),
  body('isActive').optional().isBoolean().withMessage('Active status must be true or false'),
];

router.get('/active', getActiveB2BCoupons);
router.post('/validate', protect, [body('code').trim().notEmpty().withMessage('B2B coupon code is required')], validate, validateB2BCoupon);
router.get('/', adminProtect, getB2BCoupons);
router.post('/', adminProtect, createValidation, validate, createB2BCoupon);
router.put('/:id', adminProtect, updateValidation, validate, updateB2BCoupon);
router.delete('/:id', adminProtect, deleteB2BCoupon);

export default router;
