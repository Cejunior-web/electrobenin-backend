const jwt = require('jsonwebtoken');

/**
 * Utilitaires pour la gestion des tokens JWT
 * Création, vérification, et gestion des cookies
 */

/**
 * Générer un token JWT
 * @param {String} userId - ID de l'utilisateur
 * @returns {String} JWT token
 */
exports.generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

/**
 * Vérifier et décoder un token JWT
 * @param {String} token - Token à vérifier
 * @returns {Object} Payload décodé
 */
exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token invalide ou expiré');
    }
};

/**
 * Envoyer le token dans un cookie HTTP-only
 * @param {Object} res - Objet response Express
 * @param {String} token - Token JWT
 */
exports.sendTokenCookie = (res, token) => {
    const options = {
        expires: new Date(
            Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, // Protège contre XSS
        secure: process.env.NODE_ENV === 'production', // HTTPS en production
        sameSite: 'strict' // Protection CSRF
    };

    res.cookie('token', token, options);
};

/**
 * Supprimer le cookie token (logout)
 * @param {Object} res - Objet response Express
 */
exports.clearTokenCookie = (res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
};

/**
 * Extraire le token depuis les headers ou cookies
 * @param {Object} req - Objet request Express
 * @returns {String|null} Token ou null
 */
exports.extractToken = (req) => {
    let token;

    // Vérifier le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Vérifier les cookies
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    return token || null;
};

/**
 * Générer un token de réinitialisation de mot de passe
 * @returns {String} Token random
 */
exports.generateResetToken = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Hasher un token pour stockage en base
 * @param {String} token - Token à hasher
 * @returns {String} Token hashé
 */
exports.hashToken = (token) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
};
