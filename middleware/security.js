const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

/**
 * Middlewares de sécurité pour l'application
 * Rate limiting, helmet, sanitization, etc.
 */

/**
 * Rate limiter général pour toutes les routes
 */
exports.generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter strict pour les routes d'authentification
 */
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: {
        success: false,
        message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    },
    skipSuccessfulRequests: true // Ne compte que les échecs
});

/**
 * Rate limiter pour la création de ressources
 */
exports.createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 créations par heure
    message: {
        success: false,
        message: 'Limite de création atteinte. Veuillez réessayer dans 1 heure.'
    }
});

/**
 * Configuration Helmet pour sécuriser les headers HTTP
 */
exports.helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Sanitization contre les injections NoSQL
 */
exports.mongoSanitize = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️ Tentative d'injection détectée: ${key}`);
    }
});

/**
 * Protection contre la pollution de paramètres HTTP
 */
exports.hppProtection = hpp({
    whitelist: ['price', 'category', 'rating', 'sort'] // Paramètres autorisés en double
});

/**
 * Middleware pour logger les requêtes suspectes
 */
exports.logSuspiciousActivity = (req, res, next) => {
    const suspiciousPatterns = [
        /(\$where|\$regex)/i,           // MongoDB operators
        /<script>/i,                     // XSS
        /(SELECT|DROP|INSERT|UPDATE)/i,  // SQL injection
        /(\.\.|\/etc\/passwd)/i          // Path traversal
    ];

    const checkString = JSON.stringify({
        query: req.query,
        body: req.body,
        params: req.params
    });

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(checkString));

    if (isSuspicious) {
        console.warn('🚨 ACTIVITÉ SUSPECTE DÉTECTÉE:', {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString()
        });

        return res.status(403).json({
            success: false,
            message: 'Requête rejetée pour raisons de sécurité.'
        });
    }

    next();
};

/**
 * Middleware CORS personnalisé
 */
exports.corsConfig = (req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',  // Live Server
        'http://127.0.0.1:3000',
        'null',  // Pour les fichiers locaux (file://)
        process.env.CLIENT_URL
    ].filter(Boolean);

    const origin = req.headers.origin;

    // Permettre les requêtes sans origin (fichiers locaux)
    if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 heures

    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
};

/**
 * Middleware pour ajouter des headers de sécurité supplémentaires
 */
exports.additionalSecurityHeaders = (req, res, next) => {
    // Empêcher le navigateur de deviner le MIME type
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Empêcher l'affichage dans une iframe
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Activer la protection XSS du navigateur
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Forcer HTTPS en production
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
};

/**
 * Middleware pour valider les uploads de fichiers
 */
exports.validateFileUpload = (req, res, next) => {
    if (!req.files) {
        return next();
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of Object.values(req.files)) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, WEBP'
            });
        }

        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'Fichier trop volumineux. Taille maximale: 5MB'
            });
        }
    }

    next();
};

/**
 * Middleware pour nettoyer les réponses
 */
exports.sanitizeResponse = (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
        // Supprimer les champs sensibles des réponses
        if (data && typeof data === 'object') {
            const sanitize = (obj) => {
                if (Array.isArray(obj)) {
                    return obj.map(sanitize);
                }
                
                if (obj && typeof obj === 'object') {
                    const sanitized = { ...obj };
                    delete sanitized.password;
                    delete sanitized.__v;
                    delete sanitized.resetPasswordToken;
                    delete sanitized.resetPasswordExpire;
                    
                    Object.keys(sanitized).forEach(key => {
                        if (typeof sanitized[key] === 'object') {
                            sanitized[key] = sanitize(sanitized[key]);
                        }
                    });
                    
                    return sanitized;
                }
                
                return obj;
            };

            data = sanitize(data);
        }

        return originalJson.call(this, data);
    };

    next();
};

module.exports = exports;