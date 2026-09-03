// controllers/config/config.js
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// ─── HELPER: Get environment variable with fallback ──
const getEnv = (key, fallback) => {
    const value = process.env[key];
    if (value === undefined || value === '') {
        return fallback;
    }
    return value;
};

// ─── HELPER: Parse boolean ──────────────────────────
const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return false;
};

const config = {
    // ─── ENVIRONMENT ──────────────────────────────────
    isDevelopment,
    isProduction,
    isTest,
    nodeEnv: process.env.NODE_ENV || 'development',

    // ─── SERVER ──────────────────────────────────────
    port: parseInt(getEnv('PORT', '5000')),
    host: getEnv('HOST', '0.0.0.0'),

    // ─── MONGODB ─────────────────────────────────────
    mongoUri: getEnv('MONGO_URI'),
    mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // Use IPv4
    },

    // ─── JWT ─────────────────────────────────────────
    jwtSecret: getEnv('JWT_SECRET'),
    jwtExpire: getEnv('JWT_EXPIRE', '7d'),
    jwtRefreshExpire: getEnv('JWT_REFRESH_EXPIRE', '30d'),

    // ─── SESSION ─────────────────────────────────────
    sessionSecret: getEnv('SESSION_SECRET'),
    sessionConfig: {
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: isProduction ? 'none' : 'lax',
            httpOnly: true
        }
    },

    // ─── FRONTEND URLs ──────────────────────────────
    get frontendUrl() {
        if (isProduction) {
            return getEnv('FRONTEND_URL_PROD', getEnv('FRONTEND_URL', 'https://raghav-hotel-frontend.vercel.app'));
        }
        return getEnv('FRONTEND_URL_DEV', 'http://localhost:5173');
    },

    get adminUrl() {
        if (isProduction) {
            return getEnv('ADMIN_URL_PROD', getEnv('ADMIN_URL', 'https://raghav-hotel-frontend.vercel.app/admin'));
        }
        return getEnv('ADMIN_URL_DEV', 'http://localhost:5173/admin');
    },

    // ─── GOOGLE OAUTH ──────────────────────────────
    get googleClientId() {
        if (isProduction) {
            return getEnv('GOOGLE_CLIENT_ID_PROD', getEnv('GOOGLE_CLIENT_ID'));
        }
        return getEnv('GOOGLE_CLIENT_ID_DEV', getEnv('GOOGLE_CLIENT_ID'));
    },

    get googleClientSecret() {
        if (isProduction) {
            return getEnv('GOOGLE_CLIENT_SECRET_PROD', getEnv('GOOGLE_CLIENT_SECRET'));
        }
        return getEnv('GOOGLE_CLIENT_SECRET_DEV', getEnv('GOOGLE_CLIENT_SECRET'));
    },

    get googleCallbackUrl() {
        if (isProduction) {
            return getEnv('GOOGLE_CALLBACK_URL_PROD',
                getEnv('GOOGLE_CALLBACK_URL', 'https://raghav-hotel-backend.onrender.com/api/auth/google/callback'));
        }
        return getEnv('GOOGLE_CALLBACK_URL_DEV', 'http://localhost:5000/api/auth/google/callback');
    },

    // ─── CORS CONFIGURATION ─────────────────────────
    get corsOrigins() {
        const origins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000',
            'https://raghav-hotel-frontend.vercel.app',
            'https://hotel-raghav-rltl-rouge.vercel.app',
            getEnv('FRONTEND_URL_PROD'),
            getEnv('FRONTEND_URL'),
            getEnv('FRONTEND_URL_DEV')
        ].filter(Boolean);

        // Remove duplicates
        return [...new Set(origins)];
    },

    // ─── CORS ORIGIN CHECK ──────────────────────────
    isOriginAllowed(origin) {
        // Always allow during development
        if (isDevelopment && !origin) return true;

        // Allow all Vercel URLs
        if (origin && origin.includes('vercel.app')) {
            return true;
        }

        // Allow all Render URLs
        if (origin && origin.includes('onrender.com')) {
            return true;
        }

        // Allow localhost
        if (origin && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/)) {
            return true;
        }

        // Check against allowed list
        return this.corsOrigins.includes(origin);
    },

    // ─── CORS OPTIONS ──────────────────────────────
    get corsOptions() {
        return {
            origin: (origin, callback) => {
                if (!origin || this.isOriginAllowed(origin)) {
                    callback(null, true);
                } else {
                    console.warn('⚠️ CORS blocked:', origin);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            exposedHeaders: ['Content-Length', 'X-Requested-With'],
            maxAge: 86400 // 24 hours
        };
    },

    // ─── EMAIL CONFIG ──────────────────────────────
    email: {
        host: getEnv('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(getEnv('SMTP_PORT', '587')),
        secure: parseBoolean(getEnv('SMTP_SECURE', 'false')),
        user: getEnv('SMTP_USER', 'raghavhotel7@gmail.com'),
        pass: getEnv('SMTP_PASS'),
        adminEmail: getEnv('ADMIN_EMAIL', 'raghavhotel7@gmail.com'),
        adminPhone: getEnv('ADMIN_PHONE', '+91 9335424144'),
        from: getEnv('SMTP_FROM', 'raghavhotel7@gmail.com')
    },

    // ─── RATE LIMITING ──────────────────────────────
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    },

    // ─── UPLOAD CONFIG ──────────────────────────────
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        destination: './uploads/'
    },

    // ─── CLOUDINARY ────────────────────────────────
    cloudinary: {
        cloudName: getEnv('CLOUDINARY_CLOUD_NAME'),
        apiKey: getEnv('CLOUDINARY_API_KEY'),
        apiSecret: getEnv('CLOUDINARY_API_SECRET'),
        folder: 'raghav-hotel'
    },

    // ─── LOGGING ────────────────────────────────────
    logging: {
        level: isDevelopment ? 'debug' : 'info',
        console: isDevelopment,
        file: !isDevelopment
    }
};

// ─── LOG CONFIG ON STARTUP ────────────────────────
const logConfig = () => {
    console.log('📋 Configuration loaded:');
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Frontend URL: ${config.frontendUrl}`);
    console.log(`   Admin URL: ${config.adminUrl}`);
    console.log(`   Google OAuth: ${config.googleClientId ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   CORS Origins: ${config.corsOrigins.join(', ')}`);
    console.log(`   Email Service: ${config.email.host} (${config.email.user})`);
};

// ─── VALIDATE REQUIRED CONFIG ────────────────────
const validateConfig = () => {
    const required = [
        'mongoUri',
        'jwtSecret',
        'sessionSecret',
        'googleClientId',
        'googleClientSecret'
    ];

    const missing = required.filter(key => {
        const value = config[key];
        return !value || value === '';
    });

    if (missing.length > 0) {
        console.warn(`⚠️ Missing required config: ${missing.join(', ')}`);
        console.warn('   Some features may not work correctly.');
        return false;
    }
    return true;
};

// ─── EXPORT ──────────────────────────────────────
export default config;
export { logConfig, validateConfig };