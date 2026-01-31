const express = require('express');
const router = express.Router();

// Controllers
const {
    createOrder,
    getMyOrders,
    getOrderById,
    trackOrder,
    cancelOrder,
    markAsPaid,
    markAsDelivered,
    updateOrderStatus,
    getAllOrders,
    getOrderStats
} = require('../controllers/orderController');

// Middleware
const { protect, restrictTo } = require('../middleware/auth');
const {
    createOrderValidation,
    mongoIdValidation,
    validate
} = require('../utils/validation');

/**
 * Routes des commandes
 * Base: /api/orders
 */

// Route publique de tracking
router.get(
    '/track/:orderNumber',
    trackOrder
);

// Routes protégées (nécessitent authentification)
router.use(protect);

router.post(
    '/',
    createOrderValidation,
    validate,
    createOrder
);

router.get(
    '/my-orders',
    getMyOrders
);

router.get(
    '/:id',
    mongoIdValidation,
    validate,
    getOrderById
);

router.put(
    '/:id/cancel',
    mongoIdValidation,
    validate,
    cancelOrder
);

// Routes Admin uniquement
router.get(
    '/',
    restrictTo('admin'),
    getAllOrders
);

router.get(
    '/stats/overview',
    restrictTo('admin'),
    getOrderStats
);

router.put(
    '/:id/pay',
    restrictTo('admin'),
    mongoIdValidation,
    validate,
    markAsPaid
);

router.put(
    '/:id/deliver',
    restrictTo('admin'),
    mongoIdValidation,
    validate,
    markAsDelivered
);

router.put(
    '/:id/status',
    restrictTo('admin'),
    mongoIdValidation,
    validate,
    updateOrderStatus
);

module.exports = router;
