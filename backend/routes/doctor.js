import express from 'express';
import { body } from 'express-validator';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validation.js';
import { adminProtect } from '../middleware/auth.js';
import {
  getDoctors,
  getDoctorBySlug,
  getFeaturedDoctors,
  getEmergencyDoctors,
  getSpecialties,
  getRegions,
  getProvincesByRegion,
  getCitiesByProvince,
  getAllDoctorsAdmin,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllSpecialtiesAdmin,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getAllRegionsAdmin,
  createRegion,
  updateRegion,
  deleteRegion,
  getAllProvincesAdmin,
  createProvince,
  updateProvince,
  deleteProvince,
  getAllCitiesAdmin,
  createCity,
  updateCity,
  deleteCity,
} from '../controllers/doctorController.js';

const router = express.Router();

// ─── PUBLIC ───
router.get('/', getDoctors);
router.get('/featured', getFeaturedDoctors);
router.get('/emergency', getEmergencyDoctors);
router.get('/specialties', getSpecialties);
router.get('/regions', getRegions);
router.get('/regions/:regionId/provinces', getProvincesByRegion);
router.get('/provinces/:provinceId/cities', getCitiesByProvince);
router.get('/slug/:slug', getDoctorBySlug);

// ─── ADMIN ───
router.get('/admin/all', adminProtect, getAllDoctorsAdmin);
router.post('/admin', adminProtect, upload.single('profilePhoto'), [
  body('name').trim().notEmpty().withMessage('Doctor name is required'),
  body('specialty').isMongoId().withMessage('Valid specialty ID is required'),
  body('hospitalClinic').trim().notEmpty().withMessage('Hospital/clinic name is required'),
  body('region').isMongoId().withMessage('Valid region ID is required'),
  body('province').isMongoId().withMessage('Valid province ID is required'),
  body('city').isMongoId().withMessage('Valid city ID is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  body('yearsOfExperience').isInt({ min: 0 }).withMessage('Years of experience must be a non-negative integer'),
], validate, createDoctor);
router.put('/admin/:id', adminProtect, upload.single('profilePhoto'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  body('yearsOfExperience').optional().isInt({ min: 0 }).withMessage('Years of experience must be a non-negative integer'),
], validate, updateDoctor);
router.delete('/admin/:id', adminProtect, deleteDoctor);

// ─── Specialties Admin ───
router.get('/admin/specialties', adminProtect, getAllSpecialtiesAdmin);
router.post('/admin/specialties', adminProtect, [
  body('name').trim().notEmpty().withMessage('Specialty name is required'),
], validate, createSpecialty);
router.put('/admin/specialties/:id', adminProtect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
], validate, updateSpecialty);
router.delete('/admin/specialties/:id', adminProtect, deleteSpecialty);

// ─── Regions Admin ───
router.get('/admin/regions', adminProtect, getAllRegionsAdmin);
router.post('/admin/regions', adminProtect, [
  body('name').trim().notEmpty().withMessage('Region name is required'),
], validate, createRegion);
router.put('/admin/regions/:id', adminProtect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
], validate, updateRegion);
router.delete('/admin/regions/:id', adminProtect, deleteRegion);

// ─── Provinces Admin ───
router.get('/admin/provinces', adminProtect, getAllProvincesAdmin);
router.post('/admin/provinces', adminProtect, [
  body('name').trim().notEmpty().withMessage('Province name is required'),
  body('region').isMongoId().withMessage('Valid region ID is required'),
], validate, createProvince);
router.put('/admin/provinces/:id', adminProtect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
], validate, updateProvince);
router.delete('/admin/provinces/:id', adminProtect, deleteProvince);

// ─── Cities Admin ───
router.get('/admin/cities', adminProtect, getAllCitiesAdmin);
router.post('/admin/cities', adminProtect, [
  body('name').trim().notEmpty().withMessage('City name is required'),
  body('region').isMongoId().withMessage('Valid region ID is required'),
  body('province').isMongoId().withMessage('Valid province ID is required'),
], validate, createCity);
router.put('/admin/cities/:id', adminProtect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
], validate, updateCity);
router.delete('/admin/cities/:id', adminProtect, deleteCity);

export default router;
