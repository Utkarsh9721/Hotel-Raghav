// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './controllers/config/passport.js';
import authRoutes from './controllers/routes/authRoute.js';
import bookingRoutes from './controllers/routes/bookingRoutes.js';
import adminRoutes from './controllers/routes/adminRoute.js';
import config from './controllers/config/config.js';
import contactRoutes from './controllers/routes/contactRoutes.js';

dotenv.config();

const app = express();

console.log('🚀 Starting Raghav Hotel Backend...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

// ✅ COMPLETE CORS CONFIGURATION - Works for both production and localhost
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        // ✅ Allow all localhost variations
        if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/)) {
            return callback(null, true);
        }

        // ✅ Allow all Vercel URLs (production)
        if (origin.includes('vercel.app')) {
            return callback(null, true);
        }

        // ✅ Allow all Render URLs (production)
        if (origin.includes('onrender.com')) {
            return callback(null, true);
        }

        // ✅ Allow specific allowed origins
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000',
            'https://hotel-raghav-rltl-rouge.vercel.app',
            'https://hotel-raghav-frontend.vercel.app',
            process.env.FRONTEND_URL,
            process.env.FRONTEND_URL_PROD
        ].filter(Boolean);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // ✅ In development, allow all origins for testing
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        console.warn('⚠️ CORS blocked:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || config.sessionSecret || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// ✅ CORS Test endpoint
app.get('/api/cors-test', (req, res) => {
    res.json({
        message: 'CORS is working!',
        origin: req.headers.origin || 'No origin',
        allowed: true,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || config.frontendUrl
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Connect to MongoDB
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || config.mongoUri);
        console.log('✅ MongoDB connected successfully');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || config.frontendUrl || 'Not set'}`);
            console.log(`🔑 Google Auth: ${config.googleClientId ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || config.email?.adminEmail || 'Not set'}`);
            console.log(`🔒 CORS: Enabled for localhost and Vercel/Render URLs`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

export default app;