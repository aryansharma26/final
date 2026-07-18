import express from 'express';
import { body } from 'express-validator';
import { getCoupons, getActiveCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from '../controllers/couponController.js';
import { protect, adminProtect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const couponCreateValidation = [
  body('code').trim().notEmpty().withMessage('Coupon code is required').isLength({ max: 40 }).withMessage('Coupon code is too long'),
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

const couponUpdateValidation = [
  body('code').optional().trim().notEmpty().withMessage('Coupon code cannot be empty').isLength({ max: 40 }).withMessage('Coupon code is too long'),
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

router.get('/active', getActiveCoupons);
router.post('/validate', protect, [body('code').trim().notEmpty().withMessage('Coupon code is required')], validate, validateCoupon);
router.get('/', adminProtect, getCoupons);
router.get('/:id', adminProtect, getCouponById);
router.post('/', adminProtect, couponCreateValidation, validate, createCoupon);
router.put('/:id', adminProtect, couponUpdateValidation, validate, updateCoupon);
router.delete('/:id', adminProtect, deleteCoupon);

export default router;
