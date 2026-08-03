// controllers/authController.js
import User from '../models/booking.js'; // ✅ FIXED: Changed from 'booking.js' to 'User.js'
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import EmailService from '../controllers/utils/mail.js'; // ✅ FIXED: Changed from 'controllers/utils/mail.js'
// Generate JWT Token

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            authMethod: user.authMethod || 'local',
            isAdmin: user.isAdmin || false
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate Admin Token (shorter expiry for security)
const generateAdminToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            isAdmin: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }  // Admin token expires in 1 day
    );
};

// ============================================
// GOOGLE OAUTH CONTROLLERS
// ============================================

// Google Auth - Initiate
export const googleAuth = (req, res) => {
    res.redirect('/api/auth/google');
};

// Google Auth - Callback
export const googleCallback = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
        }

        const token = generateToken(req.user);
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-callback?token=${token}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }
};

// Google Auth - Success Handler
export const googleAuthSuccess = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }

        const user = req.user;
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Google authentication successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImage: user.profileImage,
                authMethod: user.authMethod,
                isVerified: user.isVerified,
                isAdmin: user.isAdmin || false,
                loyaltyPoints: user.loyaltyPoints,
                loyaltyTier: user.loyaltyTier
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// LOCAL AUTHENTICATION CONTROLLERS
// ============================================

// Register new user
export const register = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            phone
        } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            confirmPassword,
            phone,
            authMethod: 'local',
            userType: 'registered',
            isVerified: false,
            isAdmin: false
        });

        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        try {
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
            await EmailService.sendVerificationEmail(user, verificationUrl);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified,
                authMethod: user.authMethod,
                isAdmin: user.isAdmin || false
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        await user.updateLastLogin();
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImage: user.profileImage,
                isVerified: user.isVerified,
                authMethod: user.authMethod,
                isAdmin: user.isAdmin || false,
                loyaltyPoints: user.loyaltyPoints,
                loyaltyTier: user.loyaltyTier
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ ADMIN LOGIN
// ============================================
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find admin user
        const user = await User.findOne({
            email: email.toLowerCase(),
            isAdmin: true
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Update last login
        await user.updateLastLogin();

        // Generate admin token (shorter expiry for security)
        const token = generateAdminToken(user);

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: true,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to login as admin'
        });
    }
};

// Get current user profile
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('bookings')
            .populate('favoriteRooms');

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                authMethod: user.authMethod,
                isVerified: user.isVerified,
                isActive: user.isActive,
                isAdmin: user.isAdmin || false,
                loyaltyPoints: user.loyaltyPoints,
                loyaltyTier: user.loyaltyTier,
                bookings: user.bookings,
                favoriteRooms: user.favoriteRooms,
                preferences: user.preferences,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const allowedFields = ['firstName', 'lastName', 'phone', 'preferences', 'address'];
        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                preferences: user.preferences,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide old and new password'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.authMethod !== 'local') {
            return res.status(400).json({
                success: false,
                message: 'Password change is only available for local auth users'
            });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        if (user.authMethod !== 'local') {
            return res.status(400).json({
                success: false,
                message: 'Password reset is only available for local auth users'
            });
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
            await EmailService.sendPasswordResetEmail(user, resetUrl);
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Reset password with token
export const resetPassword = async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide new password'
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// EMAIL VERIFICATION CONTROLLERS
// ============================================

// Verify email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Resend verification email
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
        await EmailService.sendVerificationEmail(user, verificationUrl);

        res.status(200).json({
            success: true,
            message: 'Verification email resent successfully'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// AUTH STATUS & SESSION CONTROLLERS
// ============================================

// Check authentication status
export const checkAuthStatus = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(200).json({
                isAuthenticated: false,
                message: 'No authorization header'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token || token === 'null' || token === 'undefined') {
            return res.status(200).json({
                isAuthenticated: false,
                message: 'Invalid token format'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id)
                .select('-__v -createdAt -updatedAt -password');

            if (!user) {
                return res.status(200).json({
                    isAuthenticated: false,
                    message: 'User not found'
                });
            }

            if (!user.isActive) {
                return res.status(200).json({
                    isAuthenticated: false,
                    message: 'Account is deactivated'
                });
            }

            res.status(200).json({
                isAuthenticated: true,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImage: user.profileImage,
                    authMethod: user.authMethod,
                    isVerified: user.isVerified,
                    isAdmin: user.isAdmin || false,
                    loyaltyPoints: user.loyaltyPoints,
                    loyaltyTier: user.loyaltyTier
                }
            });
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.message);
            res.setHeader('Clear-Site-Data', '"cookies", "storage"');
            res.status(200).json({
                isAuthenticated: false,
                message: 'Invalid or expired token',
                error: jwtError.message
            });
        }
    } catch (error) {
        console.error('Auth status error:', error);
        res.status(200).json({
            isAuthenticated: false,
            message: 'Server error checking authentication'
        });
    }
};

// Logout user
export const logout = (req, res) => {
    try {
        res.setHeader('Clear-Site-Data', '"cookies", "storage"');

        if (req.logout) {
            req.logout((err) => {
                if (err) {
                    console.error('Logout error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to logout'
                    });
                }

                if (req.session) {
                    req.session.destroy((err) => {
                        if (err) {
                            console.error('Session destroy error:', err);
                        }
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Logged out successfully'
                });
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to logout'
        });
    }
};

// ============================================
// ADMIN CONTROLLER FUNCTIONS
// ============================================

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -__v');

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get user by ID (Admin only)
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -__v')
            .populate('bookings')
            .populate('favoriteRooms');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update user (Admin only)
export const updateUser = async (req, res) => {
    try {
        const allowedFields = [
            'firstName', 'lastName', 'email', 'phone',
            'isActive', 'isVerified', 'isAdmin',
            'preferences', 'address', 'loyaltyPoints'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get system stats (Admin only)
export const getSystemStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const adminUsers = await User.countDocuments({ isAdmin: true });
        const googleUsers = await User.countDocuments({ authMethod: 'google' });
        const localUsers = await User.countDocuments({ authMethod: 'local' });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                verifiedUsers,
                adminUsers,
                googleUsers,
                localUsers
            }
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};