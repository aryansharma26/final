import express from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile, updateAvatar, changePassword, addAddress, updateAddress, deleteAddress, getAllUsers, getUsersByCategoryPurchase, getUserById, updateUserStatus, updateUserAdminNotes } from '../controllers/userController.js';
import { protect, adminProtect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, [
  body('phone').optional().trim(),
], validate, updateProfile);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], validate, changePassword);
router.post('/address', protect, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('addressLine1').trim().notEmpty().withMessage('Address is required'),
  body('barangay').optional({ checkFalsy: true }).trim(),
  body('province').optional({ checkFalsy: true }).trim(),
  body('cityMunicipality').optional({ checkFalsy: true }).trim(),
  body('zipCode').optional({ checkFalsy: true }).trim().matches(/^\d{4}$/).withMessage('Zip code must be exactly 4 digits'),
], validate, addAddress);
router.put('/address/:addressId', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('addressLine1').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('barangay').optional({ checkFalsy: true }).trim(),
  body('province').optional({ checkFalsy: true }).trim(),
  body('cityMunicipality').optional({ checkFalsy: true }).trim(),
  body('zipCode').optional({ checkFalsy: true }).trim().matches(/^\d{4}$/).withMessage('Zip code must be exactly 4 digits'),
], validate, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.get('/', adminProtect, getAllUsers);
router.get('/category-purchases', adminProtect, getUsersByCategoryPurchase);
router.get('/:id', adminProtect, getUserById);
router.put('/:id/status', adminProtect, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
], validate, updateUserStatus);
router.put('/:id/admin-notes', adminProtect, [
  body('adminNotes').optional().trim().isLength({ max: 2000 }).withMessage('Admin notes cannot exceed 2000 characters'),
], validate, updateUserAdminNotes);

export default router;
