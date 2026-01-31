const Product = require('../models/Product');
const { sendSuccess, sendError, getPagination, getSkip } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Controller des produits
 * CRUD complet + recherche avancée + filtres
 */

/**
 * @desc    Obtenir tous les produits avec filtres et pagination
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        category,
        minPrice,
        maxPrice,
        inStock,
        tag,
        search,
        sort = '-createdAt'
    } = req.query;

    // Construire la query
    const query = Product.find();

    // Filtres
    if (category) {
        query.where('category').equals(category);
    }

    if (minPrice || maxPrice) {
        query.where('price')
            .gte(minPrice || 0)
            .lte(maxPrice || Number.MAX_VALUE);
    }

    if (inStock === 'true') {
        query.where('stock').gt(0);
    }

    if (tag) {
        query.where('tag').equals(tag);
    }

    if (search) {
        query.or([
            { 'name.fr': new RegExp(search, 'i') },
            { 'name.en': new RegExp(search, 'i') },
            { 'description.fr': new RegExp(search, 'i') },
            { 'description.en': new RegExp(search, 'i') }
        ]);
    }

    // Compter le total avant pagination
    const total = await Product.countDocuments(query.getFilter());

    // Pagination
    const skip = getSkip(page, limit);
    query.skip(skip).limit(parseInt(limit));

    // Tri
    query.sort(sort);

    // Exécuter la query
    const products = await query;

    // Localiser les produits selon la langue
    const localizedProducts = products.map(product => 
        product.toLanguage(req.language)
    );

    sendSuccess(res, 200, 'Produits récupérés', {
        products: localizedProducts,
        pagination: getPagination(page, limit, total)
    });
});

/**
 * @desc    Obtenir un produit par ID
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 404, req.t('product.not_found'));
    }

    // Incrémenter les vues
    await product.incrementViews();

    sendSuccess(res, 200, 'Produit récupéré', {
        product: product.toLanguage(req.language)
    });
});

/**
 * @desc    Créer un nouveau produit
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);

    sendSuccess(res, 201, req.t('product.created'), {
        product: product.toLanguage(req.language)
    });
});

/**
 * @desc    Mettre à jour un produit
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = asyncHandler(async (req, res) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 404, req.t('product.not_found'));
    }

    product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    sendSuccess(res, 200, req.t('product.updated'), {
        product: product.toLanguage(req.language)
    });
});

/**
 * @desc    Supprimer un produit
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 404, req.t('product.not_found'));
    }

    await product.deleteOne();

    sendSuccess(res, 200, req.t('product.deleted'));
});

/**
 * @desc    Obtenir les produits par catégorie
 * @route   GET /api/products/category/:category
 * @access  Public
 */
exports.getProductsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = Product.find({ category });

    const total = await Product.countDocuments({ category });

    const skip = getSkip(page, limit);
    const products = await query
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sort);

    const localizedProducts = products.map(product => 
        product.toLanguage(req.language)
    );

    sendSuccess(res, 200, 'Produits récupérés', {
        products: localizedProducts,
        pagination: getPagination(page, limit, total)
    });
});

/**
 * @desc    Obtenir les produits populaires
 * @route   GET /api/products/featured/popular
 * @access  Public
 */
exports.getPopularProducts = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const products = await Product.find({ tag: 'POPULAIRE' })
        .limit(parseInt(limit))
        .sort('-sales');

    const localizedProducts = products.map(product => 
        product.toLanguage(req.language)
    );

    sendSuccess(res, 200, 'Produits populaires récupérés', {
        products: localizedProducts
    });
});

/**
 * @desc    Obtenir les nouveaux produits
 * @route   GET /api/products/featured/new
 * @access  Public
 */
exports.getNewProducts = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const products = await Product.find({ tag: 'NOUVEAU' })
        .limit(parseInt(limit))
        .sort('-createdAt');

    const localizedProducts = products.map(product => 
        product.toLanguage(req.language)
    );

    sendSuccess(res, 200, 'Nouveaux produits récupérés', {
        products: localizedProducts
    });
});

/**
 * @desc    Obtenir les produits en promotion
 * @route   GET /api/products/featured/promotions
 * @access  Public
 */
exports.getPromotions = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const products = await Product.find({ tag: 'PROMOTION' })
        .limit(parseInt(limit))
        .sort('-createdAt');

    const localizedProducts = products.map(product => 
        product.toLanguage(req.language)
    );

    sendSuccess(res, 200, 'Promotions récupérées', {
        products: localizedProducts
    });
});

/**
 * @desc    Recherche avancée de produits
 * @route   POST /api/products/search
 * @access  Public
 */
exports.advancedSearch = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const query = Product.advancedSearch(req.body);

    const total = await Product.countDocuments(query.getFilter());

    const skip = getSkip(page, limit);
    const products = await query
        .skip(skip)
        .limit(parseInt(limit))
        .sort(req.body.sort || '-createdAt');

    const localizedProducts = products.map(product => 
        product.toLanguage(req.language)
    );

    sendSuccess(res, 200, 'Résultats de recherche', {
        products: localizedProducts,
        pagination: getPagination(page, limit, total)
    });
});

/**
 * @desc    Obtenir les catégories avec nombre de produits
 * @route   GET /api/products/stats/categories
 * @access  Public
 */
exports.getCategoriesStats = asyncHandler(async (req, res) => {
    const stats = await Product.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    sendSuccess(res, 200, 'Statistiques des catégories', {
        categories: stats
    });
});

/**
 * @desc    Vérifier la disponibilité d'un produit
 * @route   GET /api/products/:id/availability
 * @access  Public
 */
exports.checkAvailability = asyncHandler(async (req, res) => {
    const { quantity = 1 } = req.query;
    
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 404, req.t('product.not_found'));
    }

    const available = product.stock >= parseInt(quantity);

    sendSuccess(res, 200, 'Disponibilité vérifiée', {
        available,
        stock: product.stock,
        requestedQuantity: parseInt(quantity)
    });
});

module.exports = exports;
