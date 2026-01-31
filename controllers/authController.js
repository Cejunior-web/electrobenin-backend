const User = require('../models/User');
const { generateToken, sendTokenCookie, clearTokenCookie } = require('../utils/jwtHelper');
const { sendSuccess, sendError } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Controller d'authentification
 * Gère inscription, connexion, déconnexion, profil, etc.
 */

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return sendError(res, 400, 'Un compte avec cet email existe déjà.');
    }

    // Créer l'utilisateur
    const user = await User.create({
        name,
        email,
        password,
        phone
    });

    // Générer le token
    const token = generateToken(user._id);

    // Envoyer le token dans un cookie
    sendTokenCookie(res, token);

    // Réponse
    sendSuccess(res, 201, req.t('auth.register.success'), {
        user: user.toSafeObject(),
        token
    });
});

/**
 * @desc    Connexion utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe (avec password)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
        return sendError(res, 401, req.t('auth.invalid_credentials'));
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
        return sendError(res, 403, req.t('auth.account_locked'));
    }

    // Vérifier le mot de passe
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
        // Incrémenter les tentatives échouées
        await user.incLoginAttempts();
        return sendError(res, 401, req.t('auth.invalid_credentials'));
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
        return sendError(res, 403, 'Compte désactivé. Contactez le support.');
    }

    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();

    // Générer le token
    const token = generateToken(user._id);

    // Envoyer le token dans un cookie
    sendTokenCookie(res, token);

    // Réponse
    sendSuccess(res, 200, req.t('auth.login.success'), {
        user: user.toSafeObject(),
        token
    });
});

/**
 * @desc    Déconnexion utilisateur
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
    // Supprimer le cookie token
    clearTokenCookie(res);

    sendSuccess(res, 200, req.t('auth.logout.success'));
});

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return sendError(res, 404, 'Utilisateur introuvable.');
    }

    sendSuccess(res, 200, 'Profil récupéré', {
        user: user.toSafeObject()
    });
});

/**
 * @desc    Mettre à jour le profil
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const allowedFields = ['name', 'phone', 'address'];
    const updates = {};

    // Filtrer seulement les champs autorisés
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        {
            new: true,
            runValidators: true
        }
    );

    if (!user) {
        return sendError(res, 404, 'Utilisateur introuvable.');
    }

    sendSuccess(res, 200, 'Profil mis à jour', {
        user: user.toSafeObject()
    });
});

/**
 * @desc    Changer le mot de passe
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur avec le password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return sendError(res, 404, 'Utilisateur introuvable.');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordCorrect = await user.matchPassword(currentPassword);

    if (!isPasswordCorrect) {
        return sendError(res, 401, 'Mot de passe actuel incorrect.');
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Générer un nouveau token
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    sendSuccess(res, 200, 'Mot de passe modifié avec succès', {
        token
    });
});

/**
 * @desc    Désactiver le compte
 * @route   DELETE /api/auth/account
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return sendError(res, 400, 'Mot de passe requis pour supprimer le compte.');
    }

    // Récupérer l'utilisateur avec le password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return sendError(res, 404, 'Utilisateur introuvable.');
    }

    // Vérifier le mot de passe
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
        return sendError(res, 401, 'Mot de passe incorrect.');
    }

    // Désactiver le compte au lieu de le supprimer
    user.isActive = false;
    await user.save();

    // Supprimer le cookie
    clearTokenCookie(res);

    sendSuccess(res, 200, 'Compte désactivé avec succès');
});

/**
 * @desc    Vérifier si un email existe déjà
 * @route   POST /api/auth/check-email
 * @access  Public
 */
exports.checkEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const exists = await User.findOne({ email });

    sendSuccess(res, 200, 'Email vérifié', {
        exists: !!exists
    });
});

/**
 * @desc    Rafraîchir le token
 * @route   POST /api/auth/refresh-token
 * @access  Private
 */
exports.refreshToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
        return sendError(res, 401, 'Utilisateur invalide.');
    }

    // Générer un nouveau token
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    sendSuccess(res, 200, 'Token rafraîchi', {
        token
    });
});

module.exports = exports;
