// routes/contactRoutes.js
import express from 'express';
import { submitContact } from '../contact/contact.js';
import { protect, authorize } from '../middlewhere/auth.js';

const router = express.Router();

// Public route - anyone can submit contact form
router.post('/submit', submitContact);

export default router;