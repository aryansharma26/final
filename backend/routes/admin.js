import express from 'express';
import { adminLogin, adminLogout, getDashboardStats, createAdmin, getAllAdmins, updateAdmin, deleteAdmin } from '../controllers/adminController.js';
import { adminProtect, superAdminProtect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, adminLogin);
router.post('/logout', adminProtect, adminLogout);
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/admins', superAdminProtect, getAllAdmins);
router.post('/admins', superAdminProtect, createAdmin);
router.put('/admins/:id', superAdminProtect, updateAdmin);
router.delete('/admins/:id', superAdminProtect, deleteAdmin);

export default router;
