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

// ✅ Create app FIRST
const app = express();

console.log('🚀 Starting Raghav Hotel Backend...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || config.frontendUrl || 'Not set'}`);

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            process.env.FRONTEND_URL,
            config.frontendUrl,
            'https://hotel-raghav-rltl-rouge.vercel.app',
            'https://raghav-hotel-frontend.vercel.app'
        ].filter(Boolean);

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn('⚠️ CORS blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session configuration
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
            // ✅ Fixed: Use config.googleClientId instead of process.env.GOOGLE_CLIENT_ID
            console.log(`🔑 Google Auth: ${config.googleClientId ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || config.email?.adminEmail || 'Not set'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

export default app;