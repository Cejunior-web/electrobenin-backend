const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendSuccess, sendError, getPagination, getSkip } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Controller des commandes
 * Création, suivi, gestion du cycle de vie
 */

/**
 * @desc    Créer une nouvelle commande
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;

    // Vérifier et calculer les totaux
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
        const product = await Product.findById(item.product);

        if (!product) {
            return sendError(res, 404, `Produit ${item.product} introuvable`);
        }

        if (product.stock < item.quantity) {
            return sendError(
                res,
                400,
                `Stock insuffisant pour ${product.name.fr}. Disponible: ${product.stock}`
            );
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
            product: product._id,
            name: product.name.fr,
            image: product.image,
            price: product.price,
            quantity: item.quantity,
            subtotal: itemSubtotal
        });

        // Décrémenter le stock
        await product.decreaseStock(item.quantity);
    }

    // Créer la commande
    const order = await Order.create({
        user: req.user.id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        pricing: {
            subtotal,
            shippingCost: 0, // À calculer selon la ville
            tax: 0,
            discount: 0,
            total: subtotal
        }
    });

    // Peupler les détails
    await order.populate('user', 'name email phone');

    sendSuccess(res, 201, req.t('order.created'), {
        order
    });
});

/**
 * @desc    Obtenir toutes les commandes de l'utilisateur
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
exports.getMyOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user.id };

    if (status) {
        query.status = status;
    }

    const total = await Order.countDocuments(query);

    const skip = getSkip(page, limit);
    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.product', 'name image');

    sendSuccess(res, 200, 'Commandes récupérées', {
        orders,
        pagination: getPagination(page, limit, total)
    });
});

/**
 * @desc    Obtenir une commande par ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('items.product', 'name image');

    if (!order) {
        return sendError(res, 404, req.t('order.not_found'));
    }

    // Vérifier que l'utilisateur a le droit de voir cette commande
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return sendError(res, 403, 'Accès interdit à cette commande');
    }

    sendSuccess(res, 200, 'Commande récupérée', {
        order
    });
});

/**
 * @desc    Obtenir une commande par numéro
 * @route   GET /api/orders/track/:orderNumber
 * @access  Public
 */
exports.trackOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
        .populate('items.product', 'name image')
        .select('-user');

    if (!order) {
        return sendError(res, 404, 'Commande introuvable avec ce numéro');
    }

    sendSuccess(res, 200, 'Suivi de commande', {
        order: {
            orderNumber: order.orderNumber,
            status: order.status,
            statusHistory: order.statusHistory,
            tracking: order.tracking,
            items: order.items,
            pricing: order.pricing,
            createdAt: order.createdAt
        }
    });
});

/**
 * @desc    Annuler une commande
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return sendError(res, 404, req.t('order.not_found'));
    }

    // Vérifier le propriétaire
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return sendError(res, 403, 'Accès interdit à cette commande');
    }

    // Vérifier si la commande peut être annulée
    if (!order.canBeCancelled) {
        return sendError(
            res,
            400,
            'Cette commande ne peut plus être annulée (statut: ' + order.status + ')'
        );
    }

    // Remettre le stock
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }

    // Annuler la commande
    await order.cancel(reason || 'Annulée par le client');

    sendSuccess(res, 200, req.t('order.cancelled'), {
        order
    });
});

/**
 * @desc    Marquer une commande comme payée (Admin)
 * @route   PUT /api/orders/:id/pay
 * @access  Private/Admin
 */
exports.markAsPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return sendError(res, 404, req.t('order.not_found'));
    }

    if (order.isPaid) {
        return sendError(res, 400, 'Commande déjà payée');
    }

    await order.markAsPaid(req.body);

    sendSuccess(res, 200, 'Commande marquée comme payée', {
        order
    });
});

/**
 * @desc    Marquer une commande comme livrée (Admin)
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
exports.markAsDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return sendError(res, 404, req.t('order.not_found'));
    }

    if (order.isDelivered) {
        return sendError(res, 400, 'Commande déjà livrée');
    }

    await order.markAsDelivered();

    sendSuccess(res, 200, 'Commande marquée comme livrée', {
        order
    });
});

/**
 * @desc    Mettre à jour le statut d'une commande (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return sendError(res, 404, req.t('order.not_found'));
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        return sendError(res, 400, 'Statut invalide');
    }

    await order.updateStatus(status, note, req.user.id);

    sendSuccess(res, 200, req.t('order.updated'), {
        order
    });
});

/**
 * @desc    Obtenir toutes les commandes (Admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
exports.getAllOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = {};

    if (status) {
        query.status = status;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);

    const skip = getSkip(page, limit);
    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email phone');

    sendSuccess(res, 200, 'Commandes récupérées', {
        orders,
        pagination: getPagination(page, limit, total)
    });
});

/**
 * @desc    Obtenir les statistiques des commandes (Admin)
 * @route   GET /api/orders/stats/overview
 * @access  Private/Admin
 */
exports.getOrderStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const stats = await Order.getStatistics(startDate, endDate);

    // Calculer le total général
    const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);
    const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0);

    sendSuccess(res, 200, 'Statistiques récupérées', {
        stats,
        summary: {
            totalOrders,
            totalRevenue,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        }
    });
});

module.exports = exports;
