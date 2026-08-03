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

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        accessType: 'offline'
    })
);

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
        session: true
    }),
    googleCallback
);

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

// ============================================
// ✅ DEBUG ROUTE - Check available routes
// ============================================
router.get('/debug-routes', (req, res) => {
    const routes = [];
    router.stack.forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            routes.push({
                path: layer.route.path,
                methods: methods
            });
        }
    });
    res.json({
        success: true,
        totalRoutes: routes.length,
        routes: routes
    });
});

export default router;