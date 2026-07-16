import express from 'express';
import { createContact, getAllContacts, getContactById, markContactAsRead, deleteContact, validateContact } from '../controllers/contactController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', validateContact, createContact);
router.get('/', adminProtect, getAllContacts);
router.get('/:id', adminProtect, getContactById);
router.put('/:id/read', adminProtect, markContactAsRead);
router.delete('/:id', adminProtect, deleteContact);

export default router;
