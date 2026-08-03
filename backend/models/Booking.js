// models/Booking.js
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    bookingReference: {
        type: String,
        unique: true,
        sparse: true
    },
    roomType: {
        type: String,
        enum: ['standard', 'deluxe', 'suite'],
        required: [true, 'Room type is required']
    },
    guests: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: [1, 'Minimum 1 guest required'],
        max: [10, 'Maximum 10 guests allowed']
    },
    checkIn: {
        type: Date,
        required: [true, 'Check-in date is required']
    },
    checkOut: {
        type: Date,
        required: [true, 'Check-out date is required']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Price cannot be negative']
    },
    nights: {
        type: Number,
        default: 0
    },
    bookingStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'checked-in', 'checked-out', 'no-show'],
        default: 'pending'
    },
    // ✅ FIXED: Remove enum validation or add a default
    paymentMethod: {
        type: String,
        // If you want to keep enum validation:
        // enum: ['credit-card', 'debit-card', 'paypal', 'cash', 'bank-transfer', 'upi'],
        // required: false,
        // default: 'cash'

        // OR simply make it a string without validation:
        type: String,
        required: false,
        default: 'cash'  // ✅ Default value
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partial'],
        default: 'pending'
    },
    guestDetails: {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            default: 'Unknown'
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        specialRequests: {
            type: String,
            default: 'None',
            trim: true
        }
    },
    adminNotes: {
        type: String,
        maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminActions: [{
        action: {
            type: String,
            enum: ['created', 'confirmed', 'cancelled', 'completed', 'checked-in', 'checked-out', 'no-show', 'contacted', 'updated']
        },
        note: {
            type: String,
            maxlength: 500
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        performedAt: {
            type: Date,
            default: Date.now
        }
    }],
    contactHistory: [{
        contactedAt: {
            type: Date,
            default: Date.now
        },
        contactedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        contactMethod: {
            type: String,
            enum: ['phone', 'email', 'sms', 'whatsapp', 'in-person']
        },
        notes: {
            type: String,
            maxlength: 500
        },
        outcome: {
            type: String,
            maxlength: 200
        },
        followUpDate: Date
    }],
    cancellationReason: {
        type: String,
        maxlength: 500
    },
    cancelledAt: {
        type: Date
    },
    cancellationFee: {
        type: Number,
        default: 0
    },
    checkedInAt: {
        type: Date
    },
    checkedOutAt: {
        type: Date
    },
    loyaltyPointsEarned: {
        type: Number,
        default: 0
    },
    loyaltyPointsUsed: {
        type: Number,
        default: 0
    },
    bookingSource: {
        type: String,
        enum: ['website', 'mobile', 'admin', 'phone', 'walk-in', 'google'],
        default: 'website'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// INDEXES
// ============================================
BookingSchema.index({ bookingReference: 1 });
BookingSchema.index({ user: 1 });
BookingSchema.index({ bookingStatus: 1 });
BookingSchema.index({ checkIn: 1 });
BookingSchema.index({ checkOut: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ 'guestDetails.email': 1 });
BookingSchema.index({ 'guestDetails.phone': 1 });

// ============================================
// VIRTUALS
// ============================================
BookingSchema.virtual('nightsCount').get(function () {
    if (!this.checkIn || !this.checkOut) return 0;
    const diffTime = Math.abs(this.checkOut - this.checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

BookingSchema.virtual('guestFullName').get(function () {
    return `${this.guestDetails.firstName} ${this.guestDetails.lastName}`;
});

BookingSchema.virtual('isActive').get(function () {
    return !['cancelled', 'checked-out', 'no-show'].includes(this.bookingStatus);
});

BookingSchema.virtual('canCancel').get(function () {
    if (['cancelled', 'completed', 'no-show'].includes(this.bookingStatus)) {
        return false;
    }
    const now = new Date();
    const checkInDate = new Date(this.checkIn);
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    return hoursUntilCheckIn > 24;
});

// ============================================
// PRE-SAVE HOOKS
// ============================================
BookingSchema.pre('save', function (next) {
    // Generate booking reference
    if (!this.bookingReference) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.bookingReference = `RAG-${timestamp}-${random}`;
    }

    // Calculate nights if not set
    if (!this.nights || this.nights === 0) {
        this.nights = this.nightsCount;
    }

    // Set cancelledAt if status is cancelled
    if (this.isModified('bookingStatus') && this.bookingStatus === 'cancelled' && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }

    next();
});

export default mongoose.model('Booking', BookingSchema);