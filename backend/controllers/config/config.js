// config/config.js
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',

    // Frontend URLs
    get frontendUrl() {
        return isDevelopment
            ? process.env.FRONTEND_URL_DEV || 'http://localhost:5173'
            : process.env.FRONTEND_URL_PROD || 'https://yourdomain.com';
    },

    get adminUrl() {
        return isDevelopment
            ? process.env.ADMIN_URL_DEV || 'http://localhost:5173/admin'
            : process.env.ADMIN_URL_PROD || 'https://yourdomain.com/admin';
    },

    // ✅ Google OAuth - Use DEV or PROD variables
    get googleClientId() {
        if (isDevelopment) {
            return process.env.GOOGLE_CLIENT_ID_DEV || process.env.GOOGLE_CLIENT_ID;
        }
        return process.env.GOOGLE_CLIENT_ID_PROD || process.env.GOOGLE_CLIENT_ID;
    },

    get googleClientSecret() {
        if (isDevelopment) {
            return process.env.GOOGLE_CLIENT_SECRET_DEV || process.env.GOOGLE_CLIENT_SECRET;
        }
        return process.env.GOOGLE_CLIENT_SECRET_PROD || process.env.GOOGLE_CLIENT_SECRET;
    },

    get googleCallbackUrl() {
        if (isDevelopment) {
            return process.env.GOOGLE_CALLBACK_URL_DEV || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
        }
        return process.env.GOOGLE_CALLBACK_URL_PROD || process.env.GOOGLE_CALLBACK_URL || 'https://yourdomain.com/api/auth/google/callback';
    },

    isDevelopment,
    isProduction,

    get corsOrigins() {
        const origins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            this.frontendUrl
        ];
        return origins.filter(Boolean);
    },

    isOriginAllowed(origin) {
        return this.corsOrigins.includes(origin) || this.isDevelopment;
    },

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