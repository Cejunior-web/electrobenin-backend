require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import de la connexion DB
const connectDB = require('./config/database');

// Import des routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// Import des middleware
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

// Initialisation de l'app
const app = express();

// ==========================================
// CONNEXION À LA BASE DE DONNÉES
// ==========================================
connectDB();

// ==========================================
// MIDDLEWARE DE SÉCURITÉ
// ==========================================
app.use(helmetConfig);
app.use(additionalSecurityHeaders);
app.use(corsConfig);
app.use('/api', generalLimiter);
app.use(mongoSanitize);
app.use(hppProtection);

// ==========================================
// MIDDLEWARE DE BASE
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==========================================
// MIDDLEWARE PERSONNALISÉS
// ==========================================
app.use(detectLanguage);
app.use(setLanguageCookie);
app.use(sanitizeResponse);

// Logger simple en développement
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
        next();
    });
}

// ==========================================
// ROUTES API
// ==========================================

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API ElectroBénin fonctionne correctement',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ==========================================
// GESTION DES ERREURS
// ==========================================
app.use('/api/*', notFound);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

app.use(errorHandler);

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
// En développement local, on lance le serveur normalement
// En production (Vercel), on exporte juste l'app
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('');
        console.log('='.repeat(60));
        console.log('✅ ELECTROBENIN API - SERVEUR DÉMARRÉ');
        console.log('='.repeat(60));
        console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
        console.log(`🚀 Serveur: http://localhost:${PORT}`);
        console.log('');
        console.log('📡 API Endpoints:');
        console.log(`   - Health Check: http://localhost:${PORT}/api/health`);
        console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
        console.log(`   - Products: http://localhost:${PORT}/api/products`);
        console.log(`   - Orders: http://localhost:${PORT}/api/orders`);
        console.log('='.repeat(60));
    });
}

// Export pour Vercel
module.exports = app;
