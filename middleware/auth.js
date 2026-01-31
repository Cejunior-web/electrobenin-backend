const User = require('../models/User');
const { verifyToken, extractToken } = require('../utils/jwtHelper');
const { sendError } = require('../utils/helpers');

/**
 * Middleware d'authentification JWT
 * Protège les routes nécessitant une authentification
 */
exports.protect = async (req, res, next) => {
    try {
        // Extraire le token depuis headers ou cookies
        const token = extractToken(req);

        if (!token) {
            return sendError(res, 401, 'Accès non autorisé. Veuillez vous connecter.');
        }

        // Vérifier et décoder le token
        const decoded = verifyToken(token);

        // Récupérer l'utilisateur depuis la base
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return sendError(res, 401, 'Utilisateur introuvable.');
        }

        // Vérifier si le compte est actif
        if (!user.isActive) {
            return sendError(res, 403, 'Compte désactivé. Contactez le support.');
        }

        // Vérifier si le compte est verrouillé
        if (user.isLocked) {
            return sendError(
                res,
                403,
                'Compte temporairement verrouillé suite à plusieurs tentatives de connexion échouées.'
            );
        }

        // Attacher l'utilisateur à la requête
        req.user = user;
        next();

    } catch (error) {
        if (error.message === 'Token invalide ou expiré') {
            return sendError(res, 401, 'Session expirée. Veuillez vous reconnecter.');
        }
        
        return sendError(res, 401, 'Erreur d\'authentification.');
    }
};

/**
 * Middleware pour restreindre l'accès aux administrateurs
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 401, 'Accès non autorisé.');
        }

        if (!roles.includes(req.user.role)) {
            return sendError(
                res,
                403,
                'Vous n\'avez pas la permission d\'effectuer cette action.'
            );
        }

        next();
    };
};

/**
 * Middleware optionnel : attache l'utilisateur s'il est connecté
 * Utile pour les routes publiques qui peuvent bénéficier de l'info user
 */
exports.optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.isActive) {
                req.user = user;
            }
        }
    } catch (error) {
        // Ne pas bloquer la requête si le token est invalide
        // L'utilisateur sera simplement considéré comme non connecté
    }

    next();
};

/**
 * Middleware pour vérifier que l'utilisateur est propriétaire de la ressource
 * @param {String} resourceUserField - Champ contenant l'ID user (ex: 'user', 'createdBy')
 */
exports.checkOwnership = (resourceUserField = 'user') => {
    return (req, res, next) => {
        // L'admin bypass cette vérification
        if (req.user.role === 'admin') {
            return next();
        }

        // Vérifier dans req.params, req.body, ou req.resource
        const resourceUserId = req.resource?.[resourceUserField] || 
                              req.body?.[resourceUserField] ||
                              req.params?.userId;

        if (!resourceUserId) {
            return sendError(res, 400, 'ID de ressource manquant.');
        }

        if (resourceUserId.toString() !== req.user.id.toString()) {
            return sendError(
                res,
                403,
                'Vous n\'êtes pas autorisé à accéder à cette ressource.'
            );
        }

        next();
    };
};

/**
 * Middleware pour vérifier l'email vérifié
 */
exports.requireEmailVerified = (req, res, next) => {
    if (!req.user.isEmailVerified) {
        return sendError(
            res,
            403,
            'Veuillez vérifier votre email avant d\'effectuer cette action.'
        );
    }
    next();
};
