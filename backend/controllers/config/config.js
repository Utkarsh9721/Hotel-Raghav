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
    host: process.env.HOST || '0.0.0.0',

    // MongoDB
    mongoUri: process.env.MONGO_URI,
    mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    },

    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',

    // Session
    sessionSecret: process.env.SESSION_SECRET,
    sessionConfig: {
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: isProduction ? 'none' : 'lax',
            httpOnly: true
        }
    },

    // Frontend URLs
    get frontendUrl() {
        if (isProduction) {
            return process.env.FRONTEND_URL || 'https://hotel-raghav.vercel.app';
        }
        return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
    },

    get adminUrl() {
        if (isProduction) {
            return process.env.ADMIN_URL || 'https://hotel-raghav.vercel.app/admin';
        }
        return process.env.ADMIN_URL_DEV || 'http://localhost:5173/admin';
    },

    // Google OAuth
    get googleClientId() {
        return process.env.GOOGLE_CLIENT_ID;
    },

    get googleClientSecret() {
        return process.env.GOOGLE_CLIENT_SECRET;
    },

    get googleCallbackUrl() {
        if (isProduction) {
            return process.env.GOOGLE_CALLBACK_URL || 'https://hotel-raghav.onrender.com/api/auth/google/callback';
        }
        return process.env.GOOGLE_CALLBACK_URL_DEV || 'http://localhost:5000/api/auth/google/callback';
    },

    // CORS
    get corsOrigins() {
        const origins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            'https://hotel-raghav.vercel.app',
            'https://hotel-raghav.onrender.com',
            'https://raghav-hotel-backend.onrender.com',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        return [...new Set(origins)];
    },

    get corsOptions() {
        return {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (origin.includes('vercel.app') || origin.includes('onrender.com')) {
                    return callback(null, true);
                }
                if (this.corsOrigins.includes(origin)) {
                    return callback(null, true);
                }
                if (this.isDevelopment) {
                    return callback(null, true);
                }
                console.warn('⚠️ CORS blocked:', origin);
                callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            exposedHeaders: ['Content-Length', 'X-Requested-With'],
            maxAge: 86400
        };
    },

    isOriginAllowed(origin) {
        if (this.isDevelopment && !origin) return true;
        if (origin && (origin.includes('vercel.app') || origin.includes('onrender.com'))) {
            return true;
        }
        return this.corsOrigins.includes(origin);
    },

    // Email
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || 'raghavhotel7@gmail.com',
        pass: process.env.SMTP_PASS,
        adminEmail: process.env.ADMIN_EMAIL || 'raghavhotel7@gmail.com',
        adminPhone: process.env.ADMIN_PHONE || '+91 9335424144'
    }
};

export default config;