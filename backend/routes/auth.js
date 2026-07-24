import express from 'express';
import { body } from 'express-validator';
import { register, login, logout, refresh, forgotPassword, resetPassword, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
], validate, register);

router.post('/login', authLimiter, [
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, login);

router.post('/logout', protect, logout);
router.post('/refresh', authLimiter, refresh);
router.post('/forgot-password', authLimiter, [
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
], validate, forgotPassword);
router.post('/reset-password', authLimiter, [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, resetPassword);
router.get('/me', protect, getMe);

export default router;
