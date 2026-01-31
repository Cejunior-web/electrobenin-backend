const mongoose = require('mongoose');

/**
 * Configuration et connexion à MongoDB
 * Gère la connexion avec retry et logging
 */
const connectDB = async () => {
    try {
        const options = {
            // Options recommandées pour MongoDB 6+
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log('✅ MongoDB connecté avec succès!');
        console.log(`📦 Database: ${conn.connection.name}`);
        console.log(`🌐 Host: ${conn.connection.host}`);

        // Gestion des événements de connexion
        mongoose.connection.on('error', (err) => {
            console.error('❌ Erreur MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB déconnecté');
        });

        // Gestion graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('👋 MongoDB déconnecté (app terminée)');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error.message);
        
        // Retry après 5 secondes en développement
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Nouvelle tentative dans 5 secondes...');
            setTimeout(connectDB, 5000);
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
