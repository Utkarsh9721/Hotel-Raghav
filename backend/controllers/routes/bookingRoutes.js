// routes/bookingRoutes.js
import express from 'express';
import {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBookingStatus,
    addContactHistory,
    getBookingStats,
    getMyBookings,
    cancelBooking
} from '../bookingAuth.js';
import { protect, authorize } from '../middlewhere/auth.js';

const router = express.Router();

// Public routes
router.post('/create', createBooking);

// User routes (authenticated)
router.get('/my-bookings', protect, getMyBookings);
router.put('/:id/cancel', protect, cancelBooking);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllBookings);
router.get('/stats', protect, authorize('admin'), getBookingStats);
router.get('/:id', protect, authorize('admin'), getBookingById);
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);
router.post('/:id/contact', protect, authorize('admin'), addContactHistory);

export default router;