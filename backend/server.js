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
import config from './controllers/config/config.js';

dotenv.config();

const app = express();

console.log('🚀 Starting Raghav Hotel Backend...');

// ─── HELMET ──────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// ─── CORS ────────────────────────────────────────
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.includes('vercel.app') || origin.includes('onrender.com')) {
            return callback(null, true);
        }
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// ─── BODY PARSER ────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── SESSION ─────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// ─── PASSPORT ────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── ROUTES ──────────────────────────────────────
console.log('📋 Registering routes...');
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// ─── ROOT ROUTE ──────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Hotel RAGHAV Backend API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            bookings: '/api/bookings',
            admin: '/api/admin',
            contact: '/api/contact',
            googleAuth: '/api/auth/google',
            googleCallback: '/api/auth/google/callback'
        },
        timestamp: new Date().toISOString()
    });
});

// ─── TEST ENDPOINTS ─────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ─── DEBUG: List all registered routes ──────────
app.get('/api/debug-routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
            routes.push({
                path: middleware.route.path,
                methods: methods
            });
        }
        // Check for router middleware
        if (middleware.name === 'router' && middleware.handle.stack) {
            const basePath = middleware.regexp.source
                .replace('\\/?(?=\\/|$)', '')
                .replace(/\\\//g, '/')
                .replace(/\^/g, '')
                .replace(/\?/g, '');
            middleware.handle.stack.forEach((layer) => {
                if (layer.route) {
                    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                    routes.push({
                        path: `/${basePath}${layer.route.path}`.replace(/\/\//g, '/'),
                        methods: methods
                    });
                }
            });
        }
    });
    res.json({
        success: true,
        totalRoutes: routes.length,
        routes: routes
    });
});

// ─── 404 HANDLER ──────────────────────────────────
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.url}`);
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
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 ========== SERVER STARTED ==========`);
            console.log(`📍 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
            console.log(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`========================================\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

export default app;