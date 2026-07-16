import express from 'express';
import { protect, adminProtect } from '../middleware/auth.js';
import { uploadPrescription } from '../middleware/uploadPrescription.js';
import {
  uploadPrescription as upload,
  getMyPrescriptions,
  getPrescriptionStatus,
  getAllPrescriptions,
  getPrescriptionStats,
  getPrescriptionById,
  downloadPrescription,
  viewPrescription,
  downloadMyPrescription,
  viewMyPrescription,
  createOrderFromPrescriptionQuote,
  reviewPrescription,
  updatePrescriptionQuote,
  deletePrescription,
} from '../controllers/prescriptionController.js';

const router = express.Router();

// User routes
router.post('/upload', protect, uploadPrescription, upload);
router.get('/my-prescriptions', protect, getMyPrescriptions);
router.get('/status', protect, getPrescriptionStatus);
router.get('/:id/view', protect, viewMyPrescription);
router.get('/:id/download', protect, downloadMyPrescription);
router.post('/:id/order', protect, createOrderFromPrescriptionQuote);

// Admin routes
router.get('/admin', adminProtect, getAllPrescriptions);
router.get('/admin/stats', adminProtect, getPrescriptionStats);
router.get('/admin/:id/view', adminProtect, viewPrescription);
router.get('/admin/:id/download', adminProtect, downloadPrescription);
router.get('/admin/:id', adminProtect, getPrescriptionById);
router.put('/admin/:id/review', adminProtect, reviewPrescription);
router.put('/admin/:id/quote', adminProtect, updatePrescriptionQuote);
router.delete('/admin/:id', adminProtect, deletePrescription);

export default router;
