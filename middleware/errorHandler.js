const { formatMongooseErrors } = require('../utils/helpers');

/**
 * Middleware de gestion d'erreurs global
 * Capture et formate toutes les erreurs de l'application
 */

/**
 * Gestionnaire d'erreurs principal
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log l'erreur en développement
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erreur:', err);
    }

    // Erreur Mongoose - Mauvais ObjectId
    if (err.name === 'CastError') {
        error.message = 'Ressource introuvable';
        error.statusCode = 404;
    }

    // Erreur Mongoose - Validation
    if (err.name === 'ValidationError') {
        error.message = 'Erreur de validation des données';
        error.statusCode = 400;
        error.errors = formatMongooseErrors(err);
    }

    // Erreur Mongoose - Duplicate Key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        error.message = `${field} '${value}' existe déjà`;
        error.statusCode = 400;
    }

    // Erreur JWT - Token invalide
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Token invalide';
        error.statusCode = 401;
    }

    // Erreur JWT - Token expiré
    if (err.name === 'TokenExpiredError') {
        error.message = 'Session expirée. Veuillez vous reconnecter.';
        error.statusCode = 401;
    }

    // Réponse d'erreur
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur serveur',
        ...(error.errors && { errors: error.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Gestionnaire pour routes non trouvées (404)
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route non trouvée: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Wrapper async pour éviter try-catch dans chaque controller
 * @param {Function} fn - Fonction async à wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Créer une erreur personnalisée avec code HTTP
 * @param {String} message - Message d'erreur
 * @param {Number} statusCode - Code HTTP
 */
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    ErrorResponse
};
