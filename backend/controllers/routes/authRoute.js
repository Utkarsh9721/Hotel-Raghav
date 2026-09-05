// routes/authRoutes.js
import express from 'express';
import passport from '../config/passport.js';
import {
    googleAuth,
    googleCallback,
    googleAuthSuccess,
    checkAuthStatus,
    logout,
    register,
    login,
    adminLogin,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification
} from '../authController.js';
import { protect } from '../middlewhere/auth.js';

const router = express.Router();

console.log('🔐 Auth Routes loaded');

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

// Initiate Google login
router.get('/google', (req, res, next) => {
    console.log('🔑 Google auth initiated');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        accessType: 'offline'
    })(req, res, next);
});

// Google callback
router.get('/google/callback', (req, res, next) => {
    console.log('🔄 Google callback received');
    console.log('📋 Query params:', req.query);

    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
        session: false
    })(req, res, next);
}, googleCallback);

// Success route
router.get('/success', googleAuthSuccess);

// ============================================
// LOCAL AUTHENTICATION ROUTES
// ============================================

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);

// ============================================
// PROTECTED ROUTES
// ============================================

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// ============================================
// PASSWORD RESET ROUTES
// ============================================

router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// ============================================
// EMAIL VERIFICATION ROUTES
// ============================================

router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// ============================================
// AUTH STATUS & SESSION ROUTES
// ============================================

router.get('/status', checkAuthStatus);
router.post('/logout', protect, logout);

export default router;