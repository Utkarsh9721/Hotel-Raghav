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

    // ✅ FIXED: Frontend URLs based on environment
    get frontendUrl() {
        // If we're in production, use PROD URL
        if (isProduction) {
            return process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'https://raghav-hotel-frontend.vercel.app';
        }
        // Otherwise use DEV URL
        return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
    },

    get adminUrl() {
        if (isProduction) {
            return process.env.ADMIN_URL_PROD || process.env.ADMIN_URL || 'https://raghav-hotel-frontend.vercel.app/admin';
        }
        return process.env.ADMIN_URL_DEV || 'http://localhost:5173/admin';
    },

    // ✅ FIXED: Google OAuth based on environment
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

    // ✅ FIXED: CORS allowed origins
    get corsOrigins() {
        const origins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            this.frontendUrl,
            'https://raghav-hotel-frontend.vercel.app'
        ];

        if (isProduction) {
            origins.push(
                process.env.FRONTEND_URL_PROD,
                'https://raghav-hotel-frontend.vercel.app'
            );
        }

        return origins.filter(Boolean);
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
    },

    // ✅ Added: Check if origin is allowed
    isOriginAllowed(origin) {
        return this.corsOrigins.includes(origin) || this.isDevelopment;
    }
};

export default config;