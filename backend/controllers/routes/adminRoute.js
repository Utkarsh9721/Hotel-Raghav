// controllers/routes/adminRoute.js (or routes/adminRoute.js)
import express from 'express';
import { protect, authorize } from '../middlewhere/auth.js';
import {
    getAllBookings,
    getBookingById,
    updateBookingStatus,
    addContactHistory,
    getBookingStats
} from '../bookingAuth.js';  // ✅ Import from bookingController

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', getBookingStats);

// Booking management
router.get('/bookings', getAllBookings);
router.get('/bookings/:id', getBookingById);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/contact', addContactHistory);

export default router;