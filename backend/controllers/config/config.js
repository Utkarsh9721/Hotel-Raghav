// controllers/config/config.js
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const config = {
    // Environment
    isDevelopment,
    isProduction,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Server
    port: process.env.PORT || 5000,

    // MongoDB
    mongoUri: process.env.MONGO_URI,

    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',

    // Session
    sessionSecret: process.env.SESSION_SECRET,

    // ✅ Frontend URLs based on environment
    get frontendUrl() {
        if (isProduction) {
            return process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'https://raghav-hotel-frontend.vercel.app';
        }
        return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
    },

    get adminUrl() {
        if (isProduction) {
            return process.env.ADMIN_URL_PROD || process.env.ADMIN_URL || 'https://raghav-hotel-frontend.vercel.app/admin';
        }
        return process.env.ADMIN_URL_DEV || 'http://localhost:5173/admin';
    },

    // ✅ Google OAuth based on environment
    get googleClientId() {
        if (isProduction) {
            return process.env.GOOGLE_CLIENT_ID_PROD || process.env.GOOGLE_CLIENT_ID;
        }
        return process.env.GOOGLE_CLIENT_ID_DEV || process.env.GOOGLE_CLIENT_ID;
    },

    get googleClientSecret() {
        if (isProduction) {
            return process.env.GOOGLE_CLIENT_SECRET_PROD || process.env.GOOGLE_CLIENT_SECRET;
        }
        return process.env.GOOGLE_CLIENT_SECRET_DEV || process.env.GOOGLE_CLIENT_SECRET;
    },

    get googleCallbackUrl() {
        if (isProduction) {
            return process.env.GOOGLE_CALLBACK_URL_PROD || process.env.GOOGLE_CALLBACK_URL ||
                'https://raghav-hotel-backend.onrender.com/api/auth/google/callback';
        }
        return process.env.GOOGLE_CALLBACK_URL_DEV || 'http://localhost:5000/api/auth/google/callback';
    },

    // ✅ FIXED: CORS allowed origins - Allow all Vercel URLs
    get corsOrigins() {
        const origins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            'https://hotel-raghav-frontend.vercel.app',
            'https://hotel-raghav-rltl-rouge.vercel.app',
            // ✅ Add any URL that contains vercel.app
            ...(process.env.FRONTEND_URL_PROD ? [process.env.FRONTEND_URL_PROD] : []),
            ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
        ].filter(Boolean);

        return origins;
    },

    // ✅ NEW: Check if origin is allowed (with Vercel wildcard support)
    isOriginAllowed(origin) {
        // Allow all Vercel URLs
        if (origin && origin.includes('vercel.app')) {
            return true;
        }
        return this.corsOrigins.includes(origin) || this.isDevelopment;
    },

    // Email
    email: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        adminEmail: process.env.ADMIN_EMAIL,
        adminPhone: process.env.ADMIN_PHONE
    }
};

export default config;