/**
 * Middleware d'internationalisation (i18n)
 * Support FR/EN avec détection automatique
 */

// Dictionnaire de traductions
const translations = {
    fr: {
        // Messages d'authentification
        'auth.login.success': 'Connexion réussie',
        'auth.register.success': 'Inscription réussie',
        'auth.logout.success': 'Déconnexion réussie',
        'auth.unauthorized': 'Accès non autorisé',
        'auth.invalid_credentials': 'Email ou mot de passe incorrect',
        'auth.account_locked': 'Compte temporairement verrouillé',
        'auth.session_expired': 'Session expirée',
        
        // Messages de validation
        'validation.required': 'Ce champ est requis',
        'validation.email': 'Email invalide',
        'validation.password': 'Mot de passe trop faible',
        'validation.phone': 'Numéro de téléphone invalide',
        
        // Messages de produits
        'product.created': 'Produit créé avec succès',
        'product.updated': 'Produit mis à jour',
        'product.deleted': 'Produit supprimé',
        'product.not_found': 'Produit introuvable',
        'product.out_of_stock': 'Produit en rupture de stock',
        
        // Messages de commandes
        'order.created': 'Commande créée avec succès',
        'order.updated': 'Commande mise à jour',
        'order.cancelled': 'Commande annulée',
        'order.not_found': 'Commande introuvable',
        
        // Messages généraux
        'success': 'Opération réussie',
        'error': 'Une erreur est survenue',
        'not_found': 'Ressource introuvable',
        'forbidden': 'Accès interdit',
        'server_error': 'Erreur serveur'
    },
    en: {
        // Authentication messages
        'auth.login.success': 'Login successful',
        'auth.register.success': 'Registration successful',
        'auth.logout.success': 'Logout successful',
        'auth.unauthorized': 'Unauthorized access',
        'auth.invalid_credentials': 'Invalid email or password',
        'auth.account_locked': 'Account temporarily locked',
        'auth.session_expired': 'Session expired',
        
        // Validation messages
        'validation.required': 'This field is required',
        'validation.email': 'Invalid email',
        'validation.password': 'Password too weak',
        'validation.phone': 'Invalid phone number',
        
        // Product messages
        'product.created': 'Product created successfully',
        'product.updated': 'Product updated',
        'product.deleted': 'Product deleted',
        'product.not_found': 'Product not found',
        'product.out_of_stock': 'Product out of stock',
        
        // Order messages
        'order.created': 'Order created successfully',
        'order.updated': 'Order updated',
        'order.cancelled': 'Order cancelled',
        'order.not_found': 'Order not found',
        
        // General messages
        'success': 'Operation successful',
        'error': 'An error occurred',
        'not_found': 'Resource not found',
        'forbidden': 'Access forbidden',
        'server_error': 'Server error'
    }
};

/**
 * Middleware pour détecter et configurer la langue
 */
exports.detectLanguage = (req, res, next) => {
    // 1. Vérifier le query parameter (?lang=fr)
    let lang = req.query.lang;
    
    // 2. Vérifier le header Accept-Language
    if (!lang && req.headers['accept-language']) {
        const acceptedLanguages = req.headers['accept-language'].split(',');
        const primaryLang = acceptedLanguages[0].split('-')[0];
        lang = ['fr', 'en'].includes(primaryLang) ? primaryLang : 'fr';
    }
    
    // 3. Vérifier les cookies
    if (!lang && req.cookies.language) {
        lang = req.cookies.language;
    }
    
    // 4. Langue par défaut: français
    req.language = ['fr', 'en'].includes(lang) ? lang : 'fr';
    
    // Ajouter la fonction de traduction à req
    req.t = (key, defaultValue = key) => {
        return translations[req.language][key] || defaultValue;
    };
    
    // Ajouter les traductions complètes
    req.translations = translations[req.language];
    
    next();
};

/**
 * Middleware pour setter la langue dans un cookie
 */
exports.setLanguageCookie = (req, res, next) => {
    if (req.query.lang && ['fr', 'en'].includes(req.query.lang)) {
        res.cookie('language', req.query.lang, {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 an
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });
    }
    next();
};

/**
 * Helper pour obtenir une traduction
 * @param {String} key - Clé de traduction
 * @param {String} lang - Langue (fr/en)
 * @param {String} defaultValue - Valeur par défaut
 */
exports.translate = (key, lang = 'fr', defaultValue = key) => {
    return translations[lang]?.[key] || defaultValue;
};

/**
 * Obtenir toutes les traductions pour une langue
 * @param {String} lang - Langue (fr/en)
 */
exports.getAllTranslations = (lang = 'fr') => {
    return translations[lang] || translations.fr;
};

/**
 * Middleware pour retourner les produits dans la langue demandée
 */
exports.localizeProducts = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        if (data.data) {
            // Si c'est un tableau de produits
            if (Array.isArray(data.data.products)) {
                data.data.products = data.data.products.map(product => {
                    if (product.toLanguage) {
                        return product.toLanguage(req.language);
                    }
                    return product;
                });
            }
            // Si c'est un seul produit
            else if (data.data.product?.toLanguage) {
                data.data.product = data.data.product.toLanguage(req.language);
            }
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

/**
 * Middleware pour traduire les messages d'erreur
 */
exports.translateErrors = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        if (typeof data === 'object' && data.message) {
            // Essayer de traduire le message
            const translatedMessage = req.t(data.message, data.message);
            data.message = translatedMessage;
        }
        
        return originalSend.call(this, data);
    };
    
    next();
};

module.exports = exports;
