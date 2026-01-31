const express = require('express');
const router = express.Router();

// Controllers
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getPopularProducts,
    getNewProducts,
    getPromotions,
    advancedSearch,
    getCategoriesStats,
    checkAvailability
} = require('../controllers/productController');

// Middleware
const { protect, restrictTo } = require('../middleware/auth');
const {
    createProductValidation,
    updateProductValidation,
    mongoIdValidation,
    searchValidation,
    validate
} = require('../utils/validation');

/**
 * Routes des produits
 * Base: /api/products
 */

// Routes publiques
router.get(
    '/',
    searchValidation,
    validate,
    getProducts
);

router.get(
    '/featured/popular',
    getPopularProducts
);

router.get(
    '/featured/new',
    getNewProducts
);

router.get(
    '/featured/promotions',
    getPromotions
);

router.get(
    '/stats/categories',
    getCategoriesStats
);

router.post(
    '/search',
    advancedSearch
);

router.get(
    '/category/:category',
    getProductsByCategory
);

router.get(
    '/:id',
    mongoIdValidation,
    validate,
    getProductById
);

router.get(
    '/:id/availability',
    mongoIdValidation,
    validate,
    checkAvailability
);

// Routes protégées (Admin uniquement)
router.post(
    '/',
    protect,
    restrictTo('admin'),
    createProductValidation,
    validate,
    createProduct
);

router.put(
    '/:id',
    protect,
    restrictTo('admin'),
    updateProductValidation,
    validate,
    updateProduct
);

router.delete(
    '/:id',
    protect,
    restrictTo('admin'),
    mongoIdValidation,
    validate,
    deleteProduct
);

module.exports = router;
