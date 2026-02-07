const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Schéma utilisateur avec authentification sécurisée
 * Inclut hash de mot de passe, validation email, et gestion tokens
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true,
        minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
        maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Veuillez fournir un email valide'
        ]
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false // Ne pas retourner le password par défaut
    },
    phone: {
        type: String,
        trim: true
    }$/,
            'Numéro de téléphone invalide (format: +229XXXXXXXX ou XXXXXXXX)'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        country: { type: String, default: 'Bénin' }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// ==========================================
// MIDDLEWARE PRE-SAVE : Hash du mot de passe
// ==========================================
userSchema.pre('save', async function(next) {
    // Ne hash que si le password est modifié
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ==========================================
// MÉTHODES D'INSTANCE
// ==========================================

/**
 * Comparer le mot de passe fourni avec le hash en base
 * @param {String} enteredPassword - Mot de passe en clair
 * @returns {Boolean}
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Générer un token JWT signé
 * @returns {String} JWT token
 */
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

/**
 * Incrémenter les tentatives de connexion échouées
 */
userSchema.methods.incLoginAttempts = function() {
    // Si le compte est déjà verrouillé et que la période est expirée
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

    // Verrouiller le compte après max tentatives (2 heures)
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }

    return this.updateOne(updates);
};

/**
 * Réinitialiser les tentatives de connexion après succès
 */
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0, lastLogin: Date.now() },
        $unset: { lockUntil: 1 }
    });
};

// ==========================================
// PROPRIÉTÉS VIRTUELLES
// ==========================================

/**
 * Vérifier si le compte est verrouillé
 */
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Retourner l'utilisateur sans données sensibles
 */
userSchema.methods.toSafeObject = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    delete obj.loginAttempts;
    delete obj.lockUntil;
    return obj;
};

// ==========================================
// INDEXES POUR PERFORMANCE
// ==========================================
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
