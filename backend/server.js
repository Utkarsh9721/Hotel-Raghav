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
import contactRoutes from './controllers/routes/contactRoutes.js'; // ✅ Added contact routes

dotenv.config();
const app = express();

console.log('🚀 Starting Raghav Hotel Backend...');
console.log(`📍 Environment: ${config.nodeEnv}`);
console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
console.log(`🔗 Admin URL: ${config.adminUrl}`);
console.log(`🔑 Google Callback: ${config.googleCallbackUrl}`);
console.log(`🔒 CORS Origins: ${config.corsOrigins.join(', ')}`);

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (config.isOriginAllowed && config.isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            // In development, allow all origins for testing
            if (config.isDevelopment) {
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

// Session configuration
app.use(session({
    secret: config.sessionSecret || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.isProduction || false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: config.isProduction ? 'none' : 'lax'
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes); // ✅ Added contact routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        frontendUrl: config.frontendUrl
    });
});

// Config check route (for debugging)
app.get('/api/config-check', (req, res) => {
    res.json({
        success: true,
        environment: config.nodeEnv,
        frontendUrl: config.frontendUrl,
        googleCallbackUrl: config.googleCallbackUrl,
        isDevelopment: config.isDevelopment,
        isProduction: config.isProduction,
        corsOrigins: config.corsOrigins || []
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
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Connect to MongoDB
const startServer = async () => {
    try {
        await mongoose.connect(config.mongoUri || process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');

        app.listen(config.port || 5000, () => {
            console.log(`🚀 Server running on port ${config.port || 5000}`);
            console.log(`📍 Environment: ${config.nodeEnv}`);
            console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
            console.log(`🔑 Google Auth: ${config.googleClientId ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`📧 Admin Email: ${config.email?.adminEmail || 'Not set'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

export default app;