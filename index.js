require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { detectLanguage, setLanguageCookie } = require('./middleware/i18n');
const {
    generalLimiter,
    helmetConfig,
    mongoSanitize,
    hppProtection,
    corsConfig,
    additionalSecurityHeaders,
    sanitizeResponse
} = require('./middleware/security');

const app = express();

// DB
connectDB();

// Security
app.use(helmetConfig);
app.use(additionalSecurityHeaders);
app.use(corsConfig);
app.use('/api', generalLimiter);
app.use(mongoSanitize);
app.use(hppProtection);

// Base
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Custom
app.use(detectLanguage);
app.use(setLanguageCookie);
app.use(sanitizeResponse);

// Routes API
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API ElectroBénin fonctionne correctement',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// Error handler
app.use(errorHandler);

// DÉVELOPPEMENT LOCAL
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('✅ ELECTROBENIN API - http://localhost:' + PORT);
    });
}

// EXPORT POUR VERCEL - C'EST LA CLÉ
module.exports = app;
