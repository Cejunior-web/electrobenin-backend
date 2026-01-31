/**
 * Fonctions utilitaires générales
 * Helpers pour responses, erreurs, pagination, etc.
 */

/**
 * Formater une réponse de succès standardisée
 * @param {Object} res - Response object
 * @param {Number} statusCode - Code HTTP
 * @param {String} message - Message de succès
 * @param {Object} data - Données à retourner
 */
exports.sendSuccess = (res, statusCode = 200, message = 'Succès', data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Formater une réponse d'erreur standardisée
 * @param {Object} res - Response object
 * @param {Number} statusCode - Code HTTP
 * @param {String} message - Message d'erreur
 * @param {Object} errors - Détails des erreurs
 */
exports.sendError = (res, statusCode = 500, message = 'Erreur serveur', errors = null) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Générer un objet de pagination
 * @param {Number} page - Page actuelle
 * @param {Number} limit - Limite par page
 * @param {Number} total - Total d'éléments
 * @returns {Object} Objet de pagination
 */
exports.getPagination = (page = 1, limit = 10, total = 0) => {
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const totalPages = Math.ceil(total / itemsPerPage);

    return {
        currentPage,
        itemsPerPage,
        totalItems: total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null
    };
};

/**
 * Calculer skip pour pagination MongoDB
 * @param {Number} page - Numéro de page
 * @param {Number} limit - Limite par page
 * @returns {Number} Skip value
 */
exports.getSkip = (page = 1, limit = 10) => {
    return (parseInt(page) - 1) * parseInt(limit);
};

/**
 * Formater les erreurs Mongoose
 * @param {Object} error - Erreur Mongoose
 * @returns {Array} Tableau d'erreurs formatées
 */
exports.formatMongooseErrors = (error) => {
    const errors = [];

    if (error.errors) {
        Object.keys(error.errors).forEach(key => {
            errors.push({
                field: key,
                message: error.errors[key].message
            });
        });
    }

    return errors;
};

/**
 * Générer un slug depuis un texte
 * @param {String} text - Texte à slugifier
 * @returns {String} Slug
 */
exports.slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ýÿ]/g, 'y')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Formater un prix en FCFA
 * @param {Number} price - Prix à formater
 * @returns {String} Prix formaté
 */
exports.formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
    }).format(price);
};

/**
 * Formater une date
 * @param {Date} date - Date à formater
 * @param {String} locale - Locale (fr-FR par défaut)
 * @returns {String} Date formatée
 */
exports.formatDate = (date, locale = 'fr-FR') => {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

/**
 * Générer un numéro de commande unique
 * @returns {String} Numéro de commande
 */
exports.generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `EB${year}${month}${day}${random}`;
};

/**
 * Vérifier si une chaîne est un email valide
 * @param {String} email - Email à vérifier
 * @returns {Boolean}
 */
exports.isValidEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

/**
 * Générer un code OTP aléatoire
 * @param {Number} length - Longueur du code
 * @returns {String} Code OTP
 */
exports.generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
};

/**
 * Calculer le temps écoulé depuis une date
 * @param {Date} date - Date de départ
 * @returns {String} Temps écoulé (ex: "il y a 2 heures")
 */
exports.timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
        année: 31536000,
        mois: 2592000,
        semaine: 604800,
        jour: 86400,
        heure: 3600,
        minute: 60,
        seconde: 1
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        
        if (interval >= 1) {
            return `il y a ${interval} ${name}${interval > 1 ? 's' : ''}`;
        }
    }
    
    return 'à l\'instant';
};

/**
 * Masquer partiellement un email
 * @param {String} email - Email à masquer
 * @returns {String} Email masqué
 */
exports.maskEmail = (email) => {
    const [name, domain] = email.split('@');
    const maskedName = name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    return `${maskedName}@${domain}`;
};

/**
 * Masquer partiellement un numéro de téléphone
 * @param {String} phone - Téléphone à masquer
 * @returns {String} Téléphone masqué
 */
exports.maskPhone = (phone) => {
    if (phone.length < 4) return phone;
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
};

/**
 * Calculer un pourcentage de réduction
 * @param {Number} originalPrice - Prix original
 * @param {Number} discountedPrice - Prix réduit
 * @returns {Number} Pourcentage
 */
exports.calculateDiscountPercent = (originalPrice, discountedPrice) => {
    if (originalPrice <= discountedPrice) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Limiter le nombre de caractères d'un texte
 * @param {String} text - Texte à tronquer
 * @param {Number} maxLength - Longueur maximale
 * @returns {String} Texte tronqué
 */
exports.truncate = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};
