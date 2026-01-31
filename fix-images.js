// Script pour corriger les images des produits dans MongoDB

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const newImages = {
    "Arduino Uno R3": "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400",
    "ESP32 Dev Board": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    "Raspberry Pi 4 Model B": "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400",
    "Capteur Ultrason HC-SR04": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400",
    "Capteur DHT22": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400",
    "LCD 16x2 avec I2C": "https://images.unsplash.com/photo-1591799265444-d66432b91588?w=400",
    "Module Relais 5V 4 Canaux": "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400",
    "Pack Résistances 500 Pièces": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400",
    "Fer à Souder 60W": "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=400",
    "Multimètre Numérique": "https://images.unsplash.com/photo-1581092918484-8313e1f7e8c8?w=400"
};

async function fixImages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        for (const [productName, imageUrl] of Object.entries(newImages)) {
            await Product.updateOne(
                { 'name.fr': productName },
                { $set: { image: imageUrl } }
            );
            console.log(`✅ Image mise à jour: ${productName}`);
        }

        console.log('✅ Toutes les images ont été corrigées');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

fixImages();
