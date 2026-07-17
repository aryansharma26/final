import express from 'express';
import { body } from 'express-validator';
import { createOrder, getMyOrders, getOrderById, getAllOrders, getB2BPurchaseReport, updateOrderStatus, cancelOrder, getOrderStats, verifyPayment, uploadSeniorDoc, verifySeniorCitizenDoc } from '../controllers/orderController.js';
import { protect, adminProtect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uploadPrescription } from '../middleware/uploadPrescription.js';

const router = express.Router();

router.post('/', protect, [
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.name').trim().notEmpty().withMessage('Address name is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Address phone is required'),
  body('shippingAddress.addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.province').trim().notEmpty().withMessage('Province is required'),
  body('shippingAddress.cityMunicipality').trim().notEmpty().withMessage('City/Municipality is required'),
  body('shippingAddress.barangay').trim().notEmpty().withMessage('Barangay is required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('Zip code is required').matches(/^\d{4}$/).withMessage('Zip code must be exactly 4 digits'),
  body('paymentMethod').isIn(['cod']).withMessage('Payment method must be cod'),
], validate, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.post('/verify-payment', protect, verifyPayment);
router.post('/upload-senior-doc', protect, uploadPrescription, uploadSeniorDoc);
router.get('/stats', adminProtect, getOrderStats);
router.get('/b2b-purchase-report', adminProtect, getB2BPurchaseReport);
router.get('/admin/:id', adminProtect, getOrderById);
router.put('/admin/:id/verify-senior', adminProtect, verifySeniorCitizenDoc);
router.get('/', adminProtect, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', adminProtect, [
  body('status').isIn(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status value'),
], validate, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

export default router;
