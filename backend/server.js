// server.js or app.js
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

// ✅ Get production URL from environment
const PRODUCTION_FRONTEND_URL = process.env.FRONTEND_URL || 'https://raghav-hotel-frontend.vercel.app';

console.log('🚀 Starting Raghav Hotel Backend...');
console.log(`📍 Environment: ${config.nodeEnv || 'development'}`);
console.log(`🔗 Frontend URL: ${config.frontendUrl || PRODUCTION_FRONTEND_URL}`);
console.log(`🔗 Admin URL: ${config.adminUrl || PRODUCTION_FRONTEND_URL + '/admin'}`);
console.log(`🔑 Google Callback: ${config.googleCallbackUrl || 'http://localhost:5000/api/auth/google/callback'}`);

// ✅ Updated CORS configuration for production
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            config.frontendUrl,
            process.env.FRONTEND_URL,
            'https://raghav-hotel-frontend.vercel.app',
            'https://raghav-hotel.vercel.app',
            // Add your custom domain if you have one
            // 'https://yourdomain.com'
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // In development, allow all origins for testing
            if (config.isDevelopment || process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                console.warn('⚠️ CORS blocked:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Updated Session configuration for production
app.use(session({
    secret: config.sessionSecret || process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.isProduction || process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: (config.isProduction || process.env.NODE_ENV === 'production') ? 'none' : 'lax',
        httpOnly: true
    },
    proxy: process.env.NODE_ENV === 'production' // Trust the proxy (Render uses proxy)
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// ✅ Health check with more details
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || config.frontendUrl,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ✅ Config check route (for debugging)
app.get('/api/config-check', (req, res) => {
    res.json({
        success: true,
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || config.frontendUrl,
        googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || config.googleCallbackUrl,
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production',
        corsOrigins: [
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.FRONTEND_URL,
            config.frontendUrl
        ].filter(Boolean),
        mongoConnected: mongoose.connection.readyState === 1
    });
});

// ✅ Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Raghav Hotel API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            bookings: '/api/bookings',
            admin: '/api/admin',
            contact: '/api/contact'
        }
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
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Connect to MongoDB
const startServer = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || config.mongoUri;

        if (!mongoUri) {
            throw new Error('MongoDB URI is not defined. Please set MONGO_URI in environment variables.');
        }

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ MongoDB connected successfully');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || config.frontendUrl || 'Not set'}`);
            console.log(`🔑 Google Auth: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || config.email?.adminEmail || 'Not set'}`);
            console.log(`🔄 CORS enabled for: ${process.env.FRONTEND_URL || config.frontendUrl || 'localhost'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    process.exit(0);
});

// ✅ Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

// ✅ Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

startServer();

export default app;