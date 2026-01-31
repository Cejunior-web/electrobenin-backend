const mongoose = require('mongoose');

/**
 * Schéma commande avec gestion complète du cycle de vie
 * Inclut tracking, paiement, et historique des statuts
 */
const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        image: String,
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: String,
        country: {
            type: String,
            default: 'Bénin'
        },
        additionalInfo: String
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'mobile_money', 'bank_transfer', 'card'],
        required: true
    },
    paymentDetails: {
        transactionId: String,
        paidAt: Date,
        provider: String // MTN, Moov, Wave, etc.
    },
    pricing: {
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        shippingCost: {
            type: Number,
            default: 0,
            min: 0
        },
        tax: {
            type: Number,
            default: 0,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        index: true
    },
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    tracking: {
        carrier: String,
        trackingNumber: String,
        estimatedDelivery: Date,
        actualDelivery: Date
    },
    notes: {
        customer: String,
        internal: String
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: Date,
    isDelivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// ==========================================
// MIDDLEWARE PRE-SAVE : Génération numéro
// ==========================================
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Compter les commandes du jour
        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            }
        });
        
        this.orderNumber = `EB${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

// Mettre à jour l'historique lors du changement de statut
orderSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }
    next();
});

// ==========================================
// MÉTHODES D'INSTANCE
// ==========================================

/**
 * Marquer la commande comme payée
 * @param {Object} paymentInfo - Informations de paiement
 */
orderSchema.methods.markAsPaid = function(paymentInfo = {}) {
    this.isPaid = true;
    this.paidAt = new Date();
    this.paymentDetails = {
        ...this.paymentDetails,
        ...paymentInfo,
        paidAt: new Date()
    };
    
    if (this.status === 'pending') {
        this.status = 'confirmed';
    }
    
    return this.save();
};

/**
 * Marquer la commande comme livrée
 */
orderSchema.methods.markAsDelivered = function() {
    this.isDelivered = true;
    this.deliveredAt = new Date();
    this.status = 'delivered';
    
    if (this.tracking) {
        this.tracking.actualDelivery = new Date();
    }
    
    return this.save();
};

/**
 * Annuler la commande
 * @param {String} reason - Raison de l'annulation
 */
orderSchema.methods.cancel = function(reason) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    
    return this.save();
};

/**
 * Calculer le total de la commande
 */
orderSchema.methods.calculateTotal = function() {
    const subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    this.pricing = {
        subtotal,
        shippingCost: this.pricing?.shippingCost || 0,
        tax: this.pricing?.tax || 0,
        discount: this.pricing?.discount || 0,
        total: subtotal + (this.pricing?.shippingCost || 0) + (this.pricing?.tax || 0) - (this.pricing?.discount || 0)
    };
    
    return this.pricing.total;
};

/**
 * Ajouter une note de suivi
 * @param {String} status - Nouveau statut
 * @param {String} note - Note optionnelle
 * @param {ObjectId} userId - ID de l'utilisateur qui fait la mise à jour
 */
orderSchema.methods.updateStatus = function(status, note, userId) {
    this.status = status;
    this.statusHistory.push({
        status,
        note,
        updatedBy: userId,
        timestamp: new Date()
    });
    
    return this.save();
};

// ==========================================
// PROPRIÉTÉS VIRTUELLES
// ==========================================

/**
 * Vérifier si la commande peut être annulée
 */
orderSchema.virtual('canBeCancelled').get(function() {
    return ['pending', 'confirmed'].includes(this.status);
});

/**
 * Vérifier si la commande est finalisée
 */
orderSchema.virtual('isFinalized').get(function() {
    return ['delivered', 'cancelled'].includes(this.status);
});

// ==========================================
// MÉTHODES STATIQUES
// ==========================================

/**
 * Obtenir les statistiques des commandes
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 */
orderSchema.statics.getStatistics = async function(startDate, endDate) {
    const match = {};
    
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    
    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$pricing.total' }
            }
        }
    ]);
};

/**
 * Obtenir les commandes d'un utilisateur
 * @param {ObjectId} userId - ID de l'utilisateur
 */
orderSchema.statics.getUserOrders = function(userId) {
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('items.product', 'name image');
};

// ==========================================
// INDEXES POUR PERFORMANCE
// ==========================================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'tracking.trackingNumber': 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
