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

// Headers de sécurité
app.use(helmetConfig);
app.use(additionalSecurityHeaders);

// CORS personnalisé
app.use(corsConfig);

// Rate limiting général
app.use('/api', generalLimiter);

// Sanitization
app.use(mongoSanitize);
app.use(hppProtection);

// ==========================================
// MIDDLEWARE DE BASE
// ==========================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Middleware pour Ngrok - supprime l'avertissement
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

// ==========================================
// MIDDLEWARE PERSONNALISÉS
// ==========================================

// Détection et configuration de la langue
app.use(detectLanguage);
app.use(setLanguageCookie);

// Sanitization des réponses
app.use(sanitizeResponse);

// Logger simple en développement
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
        next();
    });
}

// ==========================================
// SERVIR LES FICHIERS STATIQUES DU FRONTEND
// ==========================================
app.use(express.static(path.join(__dirname, '../client')));

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
// ROUTES FRONTEND (HTML)
// ==========================================

// Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Page panier
app.get('/panier.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/panier.html'));
});

// Page suivi
app.get('/suivi.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/suivi.html'));
});

// Page contact
app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/contact.html'));
});

// ==========================================
// GESTION DES ERREURS
// ==========================================

// Route 404 pour les routes API non trouvées
app.use('/api/*', notFound);

// Route 404 pour les pages HTML
app.use((req, res) => {
    // Si c'est une route API, erreur JSON
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'Route API non trouvée'
        });
    }
    
    // Sinon, envoyer la page 404 HTML si elle existe
    const notFoundPath = path.join(__dirname, '../client/404.html');
    res.status(404).sendFile(notFoundPath, (err) => {
        if (err) {
            res.status(404).send('Page non trouvée');
        }
    });
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
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
    console.log('');
    console.log('🌐 Pages Frontend:');
    console.log(`   - Accueil: http://localhost:${PORT}/`);
    console.log(`   - Panier: http://localhost:${PORT}/panier.html`);
    console.log(`   - Suivi: http://localhost:${PORT}/suivi.html`);
    console.log(`   - Contact: http://localhost:${PORT}/contact.html`);
    console.log('='.repeat(60));
    console.log('');
});

// Gestion graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM reçu, fermeture gracieuse du serveur...');
    server.close(() => {
        console.log('✅ Serveur fermé');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n👋 SIGINT reçu, fermeture gracieuse du serveur...');
    server.close(() => {
        console.log('✅ Serveur fermé');
        process.exit(0);
    });
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
    console.error('❌ ERREUR NON GÉRÉE (Promise Rejection):', err);
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.error('❌ ERREUR NON CAPTURÉE (Exception):', err);
    process.exit(1);
});

module.exports = app;
