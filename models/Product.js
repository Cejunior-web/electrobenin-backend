const mongoose = require('mongoose');

/**
 * Schéma produit optimisé avec validation et indexation
 * Support multi-langue et gestion de stock avancée
 */
const productSchema = new mongoose.Schema({
    name: {
        fr: { 
            type: String, 
            required: [true, 'Le nom en français est requis'],
            trim: true
        },
        en: { 
            type: String, 
            required: [true, 'Le nom en anglais est requis'],
            trim: true
        }
    },
    description: {
        fr: { 
            type: String, 
            required: [true, 'La description en français est requise']
        },
        en: { 
            type: String, 
            required: [true, 'La description en anglais est requise']
        }
    },
    price: { 
        type: Number, 
        required: [true, 'Le prix est requis'],
        min: [0, 'Le prix ne peut pas être négatif'],
        get: v => Math.round(v * 100) / 100 // Arrondir à 2 décimales
    },
    compareAtPrice: {
        type: Number,
        min: [0, 'Le prix de comparaison ne peut pas être négatif'],
        validate: {
            validator: function(v) {
                return !v || v > this.price;
            },
            message: 'Le prix de comparaison doit être supérieur au prix actuel'
        }
    },
    stock: { 
        type: Number, 
        required: [true, 'Le stock est requis'],
        min: [0, 'Le stock ne peut pas être négatif'],
        default: 0
    },
    minStock: {
        type: Number,
        default: 5,
        min: [0, 'Le stock minimum ne peut pas être négatif']
    },
    category: { 
        type: String, 
        required: [true, 'La catégorie est requise'],
        enum: {
            values: ['Microcontrôleurs', 'Capteurs', 'Modules', 'Outils', 'Afficheurs', 'Résistances', 'Condensateurs', 'Connecteurs'],
            message: '{VALUE} n\'est pas une catégorie valide'
        },
        index: true
    },
    subcategory: {
        type: String,
        trim: true
    },
    image: { 
        type: String, 
        required: [true, 'L\'image est requise'],
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
            },
            message: 'URL d\'image invalide'
        }
    },
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
            },
            message: 'URL d\'image invalide'
        }
    }],
    tag: { 
        type: String,
        enum: {
            values: ['POPULAIRE', 'NOUVEAU', 'PROMOTION', 'RUPTURE', null],
            message: '{VALUE} n\'est pas un tag valide'
        },
        default: null
    },
    specifications: {
        type: Map,
        of: String
    },
    brand: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    weight: {
        type: Number,
        min: [0, 'Le poids ne peut pas être négatif']
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'mm', 'inch'],
            default: 'cm'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    },
    rating: {
        average: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    seoTitle: {
        fr: String,
        en: String
    },
    seoDescription: {
        fr: String,
        en: String
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// ==========================================
// MIDDLEWARE PRE-SAVE : Génération automatique
// ==========================================
productSchema.pre('save', function(next) {
    // Générer slug automatiquement depuis le nom français
    if (this.isModified('name.fr') && !this.slug) {
        this.slug = this.name.fr
            .toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Mettre à jour le tag automatiquement
    if (this.stock === 0) {
        this.tag = 'RUPTURE';
    } else if (this.stock <= this.minStock && this.tag !== 'PROMOTION') {
        this.tag = null;
    }

    next();
});

// ==========================================
// PROPRIÉTÉS VIRTUELLES
// ==========================================

/**
 * Vérifier si le produit est en stock
 */
productSchema.virtual('inStock').get(function() {
    return this.stock > 0;
});

/**
 * Calculer le pourcentage de réduction
 */
productSchema.virtual('discountPercent').get(function() {
    if (!this.compareAtPrice || this.compareAtPrice <= this.price) {
        return 0;
    }
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

/**
 * Vérifier si le stock est faible
 */
productSchema.virtual('lowStock').get(function() {
    return this.stock > 0 && this.stock <= this.minStock;
});

// ==========================================
// MÉTHODES D'INSTANCE
// ==========================================

/**
 * Décrémenter le stock après achat
 * @param {Number} quantity - Quantité achetée
 */
productSchema.methods.decreaseStock = async function(quantity) {
    if (this.stock < quantity) {
        throw new Error('Stock insuffisant');
    }
    this.stock -= quantity;
    this.sales += quantity;
    return this.save();
};

/**
 * Augmenter le compteur de vues
 */
productSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

/**
 * Retourner le produit dans la langue spécifiée
 * @param {String} lang - Code langue ('fr' ou 'en')
 */
productSchema.methods.toLanguage = function(lang = 'fr') {
    const obj = this.toObject();
    return {
        ...obj,
        name: obj.name[lang] || obj.name.fr,
        description: obj.description[lang] || obj.description.fr,
        seoTitle: obj.seoTitle?.[lang],
        seoDescription: obj.seoDescription?.[lang]
    };
};

// ==========================================
// MÉTHODES STATIQUES
// ==========================================

/**
 * Recherche avancée avec filtres
 * @param {Object} filters - Filtres de recherche
 */
productSchema.statics.advancedSearch = function(filters) {
    const query = this.find();

    if (filters.category) {
        query.where('category').equals(filters.category);
    }

    if (filters.minPrice || filters.maxPrice) {
        query.where('price').gte(filters.minPrice || 0).lte(filters.maxPrice || Infinity);
    }

    if (filters.inStock) {
        query.where('stock').gt(0);
    }

    if (filters.tag) {
        query.where('tag').equals(filters.tag);
    }

    if (filters.search) {
        query.or([
            { 'name.fr': new RegExp(filters.search, 'i') },
            { 'name.en': new RegExp(filters.search, 'i') },
            { 'description.fr': new RegExp(filters.search, 'i') },
            { 'description.en': new RegExp(filters.search, 'i') }
        ]);
    }

    return query;
};

// ==========================================
// INDEXES POUR PERFORMANCE
// ==========================================
productSchema.index({ category: 1, stock: -1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'name.fr': 'text', 'description.fr': 'text' });
productSchema.index({ sales: -1 });

module.exports = mongoose.model('Product', productSchema);
