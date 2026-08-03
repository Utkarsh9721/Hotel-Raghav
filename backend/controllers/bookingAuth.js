// controllers/bookingController.js
import Booking from '../models/Booking.js';
import User from '../models/booking.js';
import EmailService from '../controllers/utils/mail.js';

// Create booking
export const createBooking = async (req, res) => {
    try {
        const {
            roomType,
            guests,
            checkIn,
            checkOut,
            specialRequests,
            totalPrice,
            nights,
            firstName,
            lastName,
            email,
            phone,
            isGuest,
            userId
        } = req.body;

        console.log('📝 Booking Data Received:', req.body);

        // Validate required fields
        const requiredFields = ['roomType', 'guests', 'checkIn', 'checkOut', 'totalPrice', 'firstName', 'lastName', 'email', 'phone'];
        const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field] === '');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                errors: missingFields.map(f => `${f} is required`)
            });
        }

        // Get user details
        let user = null;
        if (userId) {
            user = await User.findById(userId);
        } else if (req.user) {
            user = req.user;
        }

        // Use provided values or user values
        const guestFirstName = user ? user.firstName : firstName;
        const guestLastName = user ? user.lastName : lastName;
        const guestEmail = user ? user.email : email;
        const guestPhone = user ? user.phone : phone;

        // Create booking
        const bookingData = {
            user: user ? user._id : null,
            roomType,
            guests: parseInt(guests),
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            totalPrice: parseFloat(totalPrice),
            nights: parseInt(nights) || 0,
            bookingStatus: 'pending',
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            guestDetails: {
                firstName: guestFirstName,
                lastName: guestLastName || 'Unknown',
                email: guestEmail,
                phone: guestPhone || 'Not provided',
                specialRequests: specialRequests || 'None'
            },
            adminActions: [{
                action: 'created',
                note: `Booking created ${isGuest ? 'as guest' : 'by registered user'}`,
                performedBy: user ? user._id : null
            }]
        };

        const booking = new Booking(bookingData);
        const validationError = booking.validateSync();
        if (validationError) {
            const errors = Object.values(validationError.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors
            });
        }

        await booking.save();
        console.log('✅ Booking created:', booking.bookingReference);

        if (user && typeof user.addBooking === 'function') {
            await user.addBooking(booking._id);
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate('user')
            .populate('assignedTo');

        // Send emails
        try {
            await EmailService.sendBookingNotificationToAdmin(populatedBooking);
            console.log('📧 Admin email sent');
        } catch (emailError) {
            console.error('Failed to send admin email:', emailError);
        }

        try {
            await EmailService.sendBookingConfirmationToCustomer(populatedBooking);
            console.log('📧 Customer email sent');
        } catch (emailError) {
            console.error('Failed to send customer email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Booking request sent successfully! Our team will contact you shortly.',
            booking: populatedBooking,
            user: user ? {
                id: user._id,
                email: user.email,
                name: user.fullName || `${user.firstName} ${user.lastName}`
            } : null
        });
    } catch (error) {
        console.error('❌ Booking creation error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create booking',
            errors: error.errors ? Object.values(error.errors).map(e => e.message) : []
        });
    }
};

// Get all bookings (Admin only)
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user')
            .populate('assignedTo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get booking by ID (Admin only)
export const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('user')
            .populate('assignedTo');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update booking status (Admin only)
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, contactCustomer } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const oldStatus = booking.bookingStatus;
        booking.bookingStatus = status;

        if (adminNotes) {
            booking.adminNotes = adminNotes;
        }

        booking.adminActions.push({
            action: status,
            note: adminNotes || `Status updated from ${oldStatus} to ${status}`,
            performedBy: req.user?._id || null
        });

        await booking.save();

        // Send email notifications based on status change
        if (contactCustomer && status !== oldStatus) {
            try {
                if (status === 'confirmed') {
                    await EmailService.sendBookingConfirmedEmailToCustomer(booking);
                } else if (status === 'cancelled') {
                    await EmailService.sendBookingCancelledEmailToCustomer(booking, adminNotes);
                } else {
                    await EmailService.sendStatusUpdateToCustomer(booking, status, adminNotes);
                }
            } catch (emailError) {
                console.error('Failed to send status update email:', emailError);
            }
        }

        const updatedBooking = await Booking.findById(id)
            .populate('user')
            .populate('assignedTo');

        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Add contact history (Admin only)
export const addContactHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { contactMethod, notes, outcome } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.contactHistory.push({
            contactedBy: req.user?._id || null,
            contactMethod: contactMethod || 'phone',
            notes: notes || '',
            outcome: outcome || '',
            contactedAt: new Date()
        });

        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate('user')
            .populate('assignedTo')
            .populate('contactHistory.contactedBy');

        res.status(200).json({
            success: true,
            message: 'Contact history added successfully',
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Add contact history error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get booking stats (Admin only)
export const getBookingStats = async (req, res) => {
    try {
        const total = await Booking.countDocuments();
        const pending = await Booking.countDocuments({ bookingStatus: 'pending' });
        const confirmed = await Booking.countDocuments({ bookingStatus: 'confirmed' });
        const cancelled = await Booking.countDocuments({ bookingStatus: 'cancelled' });
        const completed = await Booking.countDocuments({ bookingStatus: 'completed' });

        const totalRevenue = await Booking.aggregate([
            {
                $match: {
                    bookingStatus: { $in: ['confirmed', 'completed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                total,
                pending,
                confirmed,
                cancelled,
                completed,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Get booking stats error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get my bookings (User)
export const getMyBookings = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to view your bookings'
            });
        }

        const bookings = await Booking.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cancel booking (User)
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to cancel booking'
            });
        }

        const booking = await Booking.findOne({
            _id: id,
            user: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.bookingStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        if (booking.bookingStatus === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Completed bookings cannot be cancelled'
            });
        }

        booking.bookingStatus = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = req.body.reason || 'Cancelled by user';

        await booking.save();

        // Send cancellation email
        try {
            await EmailService.sendBookingCancelledEmailToCustomer(booking, booking.cancellationReason);
        } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            booking
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};