import Contact from '../models/Contact.js';
import { body, validationResult } from 'express-validator';

export const validateContact = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 chars)').escape(),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required (max 200 chars)').escape(),
  body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message is required (max 5000 chars)').escape(),
];

export const createContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const contact = await Contact.create(req.body);
    res.status(201).json({ success: true, message: 'Message sent successfully', contact });
  } catch (error) {
    next(error);
  }
};

export const getAllContacts = async (req, res, next) => {
  try {
    const { isRead } = req.query;
    let page = Math.max(1, Number(req.query.page) || 1);
    const isExport = req.query.export === 'true';
    const limit = isExport ? 10000 : Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const query = {};
    if (isRead !== undefined) query.isRead = isRead === 'true';
    const total = await Contact.countDocuments(query);
    const pages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, pages);
    const skip = isExport ? 0 : (page - 1) * limit;
    const contacts = await Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ success: true, count: contacts.length, total, pagination: { page, limit, pages }, contacts });
  } catch (error) {
    next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, contact });
  } catch (error) {
    next(error);
  }
};

export const markContactAsRead = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    // Always set to true (not a toggle) for predictable behavior
    contact.isRead = true;
    await contact.save();
    res.json({ success: true, message: 'Marked as read', contact });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
};
