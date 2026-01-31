require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Script de seed pour peupler la base de données
 * Utilise des produits avec traductions FR/EN
 */

const products = [
    {
        name: {
            fr: "Arduino Uno R3",
            en: "Arduino Uno R3"
        },
        description: {
            fr: "Carte de développement idéale pour débutants avec microcontrôleur ATmega328P",
            en: "Ideal development board for beginners with ATmega328P microcontroller"
        },
        price: 12500,
        stock: 45,
        category: "Microcontrôleurs",
        image: "https://store-usa.arduino.cc/cdn/shop/files/A000073_00.front_1200x900.jpg",
        tag: "POPULAIRE"
    },
    {
        name: {
            fr: "ESP32 Dev Board",
            en: "ESP32 Dev Board"
        },
        description: {
            fr: "Carte de développement avec WiFi et Bluetooth intégrés, double cœur",
            en: "Development board with integrated WiFi and Bluetooth, dual-core"
        },
        price: 18500,
        stock: 32,
        category: "Microcontrôleurs",
        image: "https://m.media-amazon.com/images/I/61Y9EwKCj1L._AC_SL1500_.jpg",
        tag: "POPULAIRE"
    },
    {
        name: {
            fr: "Raspberry Pi 4 Model B",
            en: "Raspberry Pi 4 Model B"
        },
        description: {
            fr: "Mini ordinateur 4GB RAM, idéal pour projets IoT et embarqués",
            en: "Mini computer 4GB RAM, ideal for IoT and embedded projects"
        },
        price: 45000,
        stock: 15,
        category: "Microcontrôleurs",
        image: "https://m.media-amazon.com/images/I/61n17rVxXtL._AC_SL1500_.jpg"
    },
    {
        name: {
            fr: "Capteur Ultrason HC-SR04",
            en: "Ultrasonic Sensor HC-SR04"
        },
        description: {
            fr: "Capteur de distance par ultrasons, portée 2cm à 4m",
            en: "Ultrasonic distance sensor, range 2cm to 4m"
        },
        price: 3800,
        stock: 120,
        category: "Capteurs",
        image: "https://m.media-amazon.com/images/I/61R1A7CuHTL._AC_SL1500_.jpg",
        tag: "POPULAIRE"
    },
    {
        name: {
            fr: "Capteur DHT22",
            en: "DHT22 Sensor"
        },
        description: {
            fr: "Capteur de température et humidité haute précision",
            en: "High precision temperature and humidity sensor"
        },
        price: 4500,
        stock: 65,
        category: "Capteurs",
        image: "https://m.media-amazon.com/images/I/61DGhJ1nTQL._AC_SL1500_.jpg"
    },
    {
        name: {
            fr: "LCD 16x2 avec I2C",
            en: "LCD 16x2 with I2C"
        },
        description: {
            fr: "Écran LCD 16 caractères x 2 lignes avec interface I2C",
            en: "LCD screen 16 characters x 2 lines with I2C interface"
        },
        price: 6800,
        stock: 42,
        category: "Afficheurs",
        image: "https://m.media-amazon.com/images/I/71z8VnS2bAL._AC_SL1500_.jpg"
    },
    {
        name: {
            fr: "Module Relais 5V 4 Canaux",
            en: "5V 4 Channel Relay Module"
        },
        description: {
            fr: "Module relais pour contrôler charges AC/DC, 4 canaux indépendants",
            en: "Relay module to control AC/DC loads, 4 independent channels"
        },
        price: 3200,
        stock: 78,
        category: "Modules",
        image: "https://m.media-amazon.com/images/I/71O-7U58WGL._AC_SL1500_.jpg"
    },
    {
        name: {
            fr: "Pack Résistances 500 Pièces",
            en: "Resistor Pack 500 Pieces"
        },
        description: {
            fr: "Assortiment de résistances 30 valeurs différentes",
            en: "Resistor assortment 30 different values"
        },
        price: 2800,
        stock: 56,
        category: "Résistances",
        image: "https://m.media-amazon.com/images/I/71YtGZ2PqRL._AC_SL1500_.jpg",
        tag: "NOUVEAU"
    },
    {
        name: {
            fr: "Fer à Souder 60W",
            en: "60W Soldering Iron"
        },
        description: {
            fr: "Fer à souder avec contrôle de température, pointe interchangeable",
            en: "Soldering iron with temperature control, interchangeable tip"
        },
        price: 9800,
        stock: 28,
        category: "Outils",
        image: "https://m.media-amazon.com/images/I/71cTlLWHtmL._AC_SL1500_.jpg"
    },
    {
        name: {
            fr: "Multimètre Numérique",
            en: "Digital Multimeter"
        },
        description: {
            fr: "Multimètre avec testeur de continuité, diode et transistor",
            en: "Multimeter with continuity, diode and transistor tester"
        },
        price: 12500,
        stock: 22,
        category: "Outils",
        image: "https://m.media-amazon.com/images/I/71Ebj2lJawL._AC_SL1500_.jpg"
    }
];

async function seedDatabase() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');
        
        // Nettoyer la collection
        await Product.deleteMany({});
        console.log('🗑️  Anciens produits supprimés');
        
        // Insérer les nouveaux produits
        await Product.insertMany(products);
        console.log(`✅ ${products.length} produits ajoutés avec succès`);
        
        console.log('\n📦 Produits dans la base:');
        const allProducts = await Product.find();
        allProducts.forEach(p => {
            console.log(`   - ${p.name.fr} (${p.price} FCFA) - Stock: ${p.stock}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

seedDatabase();
