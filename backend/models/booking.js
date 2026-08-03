// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    // Personal Information
    firstName: {
        type: String,
        required: function () {
            return !this.googleId; // Not required for Google auth users
        },
        trim: true
    },
    lastName: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },

    // Authentication Methods
    authMethod: {
        type: String,
        enum: ['local', 'google', 'facebook', 'guest'],
        default: 'local'
    },

    // Google OAuth Fields
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    googleAccessToken: String,
    googleRefreshToken: String,

    // Profile Image from Google
    profileImage: {
        type: String,
        default: 'default-profile.jpg'
    },

    // Local Auth Password (only for local auth)
    password: {
        type: String,
        required: function () {
            return this.authMethod === 'local';
        },
        select: false
    },
    confirmPassword: {
        type: String,
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords do not match'
        },
        select: false
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: function () {
            return this.authMethod === 'google'; // Google users are pre-verified
        }
    },
    isAdmin: {
        type: Boolean,
        default: false
    },

    // Password Reset (for local auth)
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Email Verification
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    // Booking History
    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }],

    // Favorite Rooms
    favoriteRooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }],

    // Preferences
    preferences: {
        roomPreferences: {
            bedType: {
                type: String,
                enum: ['king', 'queen', 'double', 'twin', 'single'],
                default: 'king'
            },
            smoking: {
                type: Boolean,
                default: false
            },
            floorPreference: {
                type: String,
                enum: ['high', 'low', 'no-preference'],
                default: 'no-preference'
            }
        },
        communicationPreferences: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            },
            newsletter: {
                type: Boolean,
                default: false
            }
        }
    },

    // Loyalty Program
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    loyaltyTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },

    // Address
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },

    // Last Activity
    lastLogin: {
        type: Date,
        default: Date.now
    },

    // User Type
    userType: {
        type: String,
        enum: ['guest', 'registered'],
        default: 'guest'
    },

    // Created timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
UserSchema.virtual('fullName').get(function () {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
    }
    return this.email ? this.email.split('@')[0] : 'User';
});

UserSchema.virtual('bookingCount').get(function () {
    return this.bookings ? this.bookings.length : 0;
});

UserSchema.virtual('isLoyaltyMember').get(function () {
    return this.loyaltyPoints > 0;
});

// Pre-save middleware
UserSchema.pre('save', async function (next) {
    // Hash password if modified and auth method is local
    if (this.authMethod === 'local' && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.confirmPassword = undefined;
    }

    // Update tier based on loyalty points
    if (this.loyaltyPoints >= 5000) {
        this.loyaltyTier = 'platinum';
    } else if (this.loyaltyPoints >= 3000) {
        this.loyaltyTier = 'gold';
    } else if (this.loyaltyPoints >= 1500) {
        this.loyaltyTier = 'silver';
    } else {
        this.loyaltyTier = 'bronze';
    }

    next();
});

// Pre-update middleware
UserSchema.pre('findOneAndUpdate', function (next) {
    this._update.updatedAt = Date.now();
    next();
});

// Instance Methods
UserSchema.methods = {
    // Compare password (for local auth)
    comparePassword: async function (enteredPassword) {
        if (this.authMethod !== 'local') return false;
        return await bcrypt.compare(enteredPassword, this.password);
    },

    // Generate email verification token
    getEmailVerificationToken: function () {
        const token = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        this.emailVerificationToken = token;
        this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        return token;
    },

    // Generate password reset token
    getResetPasswordToken: function () {
        const token = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        this.resetPasswordToken = token;
        this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        return token;
    },

    // Add loyalty points
    addLoyaltyPoints: function (points) {
        this.loyaltyPoints += points;
        return this.save();
    },

    // Update last login
    updateLastLogin: function () {
        this.lastLogin = Date.now();
        return this.save();
    },

    // Add booking to history
    addBooking: function (bookingId) {
        if (!this.bookings.includes(bookingId)) {
            this.bookings.push(bookingId);
            return this.save();
        }
        return this;
    },

    // Toggle favorite room
    toggleFavoriteRoom: function (roomId) {
        const index = this.favoriteRooms.indexOf(roomId);
        if (index === -1) {
            this.favoriteRooms.push(roomId);
        } else {
            this.favoriteRooms.splice(index, 1);
        }
        return this.save();
    }
};

// Static Methods
UserSchema.statics = {
    // Find user by email
    findByEmail: function (email) {
        return this.findOne({ email: email.toLowerCase() });
    },

    // Find or create Google user
    findOrCreateGoogleUser: async function (profile, tokens) {
        let user = await this.findOne({ googleId: profile.id });

        if (!user) {
            // Check if user exists with same email
            user = await this.findOne({ email: profile.emails[0].value });

            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.googleAccessToken = tokens.access_token;
                user.googleRefreshToken = tokens.refresh_token || null;
                user.authMethod = 'google';
                user.isVerified = true;
                user.profileImage = profile.photos[0]?.value || user.profileImage;
                await user.save();
            } else {
                // Create new user with Google data
                user = await this.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName || '',
                    lastName: profile.name.familyName || '',
                    profileImage: profile.photos[0]?.value || 'default-profile.jpg',
                    authMethod: 'google',
                    isVerified: true,
                    userType: 'registered',
                    googleAccessToken: tokens.access_token,
                    googleRefreshToken: tokens.refresh_token || null
                });
            }
        } else {
            // Update existing Google user tokens
            user.googleAccessToken = tokens.access_token;
            if (tokens.refresh_token) {
                user.googleRefreshToken = tokens.refresh_token;
            }
            user.lastLogin = Date.now();
            await user.save();
        }

        return user;
    },

    // Get active users
    getActiveUsers: function () {
        return this.find({ isActive: true });
    },

    // Get users by loyalty tier
    getUsersByTier: function (tier) {
        return this.find({ loyaltyTier: tier });
    },

    // Get top loyal customers
    getTopLoyalCustomers: function (limit = 10) {
        return this.find({ loyaltyPoints: { $gt: 0 } })
            .sort({ loyaltyPoints: -1 })
            .limit(limit);
    }
};

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ authMethod: 1 });
UserSchema.index({ loyaltyTier: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'bookings': 1 });

// ✅ FIXED: Use export default for ES modules
export default mongoose.model('User', UserSchema);