const { body, param, query, validationResult } = require('express-validator');

/**
 * Validateurs pour différentes opérations
 * Utilise express-validator pour validation robuste
 */

// ==========================================
// RÈGLES DE VALIDATION
// ==========================================

/**
 * Validation pour l'inscription
 */
exports.registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom est requis')
        .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    
    body('phone')
        .optional()
        .matches(/^(\+229)?[0-9]{8,}$/)
        .withMessage('Numéro de téléphone invalide')
];

/**
 * Validation pour la connexion
 */
exports.loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
];

/**
 * Validation pour mise à jour profil
 */
exports.updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    
    body('phone')
        .optional()
        .matches(/^(\+229)?[0-9]{8,}$/)
        .withMessage('Numéro de téléphone invalide'),
    
    body('address.city')
        .optional()
        .trim()
        .notEmpty().withMessage('La ville ne peut pas être vide')
];

/**
 * Validation pour changement de mot de passe
 */
exports.changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Le mot de passe actuel est requis'),
    
    body('newPassword')
        .notEmpty().withMessage('Le nouveau mot de passe est requis')
        .isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
];

/**
 * Validation pour création de produit
 */
exports.createProductValidation = [
    body('name.fr')
        .trim()
        .notEmpty().withMessage('Le nom en français est requis'),
    
    body('name.en')
        .trim()
        .notEmpty().withMessage('Le nom en anglais est requis'),
    
    body('description.fr')
        .trim()
        .notEmpty().withMessage('La description en français est requise'),
    
    body('description.en')
        .trim()
        .notEmpty().withMessage('La description en anglais est requise'),
    
    body('price')
        .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
    
    body('stock')
        .isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif'),
    
    body('category')
        .notEmpty().withMessage('La catégorie est requise')
        .isIn(['Microcontrôleurs', 'Capteurs', 'Modules', 'Outils', 'Afficheurs', 'Résistances', 'Condensateurs', 'Connecteurs'])
        .withMessage('Catégorie invalide'),
    
    body('image')
        .notEmpty().withMessage('L\'image est requise')
        .isURL().withMessage('URL d\'image invalide')
];

/**
 * Validation pour mise à jour de produit
 */
exports.updateProductValidation = [
    param('id')
        .isMongoId().withMessage('ID de produit invalide'),
    
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
    
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif')
];

/**
 * Validation pour création de commande
 */
exports.createOrderValidation = [
    body('items')
        .isArray({ min: 1 }).withMessage('La commande doit contenir au moins un article'),
    
    body('items.*.product')
        .isMongoId().withMessage('ID de produit invalide'),
    
    body('items.*.quantity')
        .isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
    
    body('shippingAddress.fullName')
        .trim()
        .notEmpty().withMessage('Le nom complet est requis'),
    
    body('shippingAddress.phone')
        .matches(/^(\+229)?[0-9]{8,}$/)
        .withMessage('Numéro de téléphone invalide'),
    
    body('shippingAddress.street')
        .trim()
        .notEmpty().withMessage('L\'adresse est requise'),
    
    body('shippingAddress.city')
        .trim()
        .notEmpty().withMessage('La ville est requise'),
    
    body('paymentMethod')
        .isIn(['cash_on_delivery', 'mobile_money', 'bank_transfer', 'card'])
        .withMessage('Méthode de paiement invalide')
];

/**
 * Validation pour paramètres de recherche
 */
exports.searchValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('La page doit être un nombre entier positif'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100'),
    
    query('minPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix minimum doit être positif'),
    
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix maximum doit être positif')
];

/**
 * Validation pour ID MongoDB
 */
exports.mongoIdValidation = [
    param('id')
        .isMongoId().withMessage('ID invalide')
];

// ==========================================
// MIDDLEWARE DE VALIDATION
// ==========================================

/**
 * Middleware pour vérifier les erreurs de validation
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 */
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    
    next();
};

/**
 * Sanitizer pour nettoyer les inputs
 */
exports.sanitizeBody = (fields) => {
    return fields.map(field => body(field).trim().escape());
};
