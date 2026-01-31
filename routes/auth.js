const express = require('express');
const router = express.Router();

// Controllers
const {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
    deleteAccount,
    checkEmail,
    refreshToken
} = require('../controllers/authController');

// Middleware
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const {
    registerValidation,
    loginValidation,
    updateProfileValidation,
    changePasswordValidation,
    validate
} = require('../utils/validation');

/**
 * Routes d'authentification
 * Base: /api/auth
 */

// Routes publiques
router.post(
    '/register',
    authLimiter,
    registerValidation,
    validate,
    register
);

router.post(
    '/login',
    authLimiter,
    loginValidation,
    validate,
    login
);

router.post(
    '/check-email',
    checkEmail
);

// Routes protégées
router.use(protect); // Toutes les routes suivantes nécessitent authentification

router.post('/logout', logout);

router.get('/me', getMe);

router.put(
    '/profile',
    updateProfileValidation,
    validate,
    updateProfile
);

router.put(
    '/password',
    changePasswordValidation,
    validate,
    changePassword
);

router.delete('/account', deleteAccount);

router.post('/refresh-token', refreshToken);

module.exports = router;
