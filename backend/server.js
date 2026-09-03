// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import helmet from 'helmet';
import passport from './controllers/config/passport.js';
import authRoutes from './controllers/routes/authRoute.js';
import bookingRoutes from './controllers/routes/bookingRoutes.js';
import adminRoutes from './controllers/routes/adminRoute.js';
import contactRoutes from './controllers/routes/contactRoutes.js';
import config, { logConfig, validateConfig } from './controllers/config/config.js';

dotenv.config();

const app = express();

console.log('🚀 Starting Raghav Hotel Backend...');
logConfig();
validateConfig();

// ─── HELMET ──────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// ─── CORS ────────────────────────────────────────
app.use(cors(config.corsOptions));

// ─── BODY PARSER ────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── SESSION ─────────────────────────────────────
app.use(session({
    secret: config.sessionSecret,
    ...config.sessionConfig
}));

// ─── PASSPORT ────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── ROUTES ──────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// ─── TEST ENDPOINTS ─────────────────────────────
app.get('/api/cors-test', (req, res) => {
    res.json({
        message: 'CORS is working!',
        origin: req.headers.origin || 'No origin',
        allowed: config.isOriginAllowed(req.headers.origin),
        environment: config.nodeEnv
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        frontendUrl: config.frontendUrl
    });
});

// ─── 404 HANDLER ──────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`
    });
});

// ─── ERROR HANDLER ──────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// ─── START SERVER ──────────────────────────────
const startServer = async () => {
    try {
        await mongoose.connect(config.mongoUri, config.mongoOptions);
        console.log('✅ MongoDB connected successfully');

        app.listen(config.port, config.host, () => {
            console.log(`\n🚀 ========== SERVER STARTED ==========`);
            console.log(`📍 Server running on http://${config.host}:${config.port}`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
            console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
            console.log(`🔑 Google Auth: ${config.googleClientId ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`🔒 CORS: Enabled for ${config.corsOrigins.length} origins`);
            console.log(`========================================\n`);
        });

        // ─── GRACEFUL SHUTDOWN ──────────────────────
        const gracefulShutdown = (signal) => {
            console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
            mongoose.connection.close(false, () => {
                console.log('✅ MongoDB connection closed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

export default app;