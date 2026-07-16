import express from 'express';
import { getPromoBanner, updatePromoBanner } from '../controllers/settingController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/promo-banner', getPromoBanner);
router.put('/promo-banner', adminProtect, updatePromoBanner);

export default router;
