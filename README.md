# 🔌 ElectroBénin - Backend API

Backend API professionnel pour ElectroBénin, boutique en ligne de composants électroniques au Bénin.

## 🚀 Fonctionnalités

### ✅ Authentification Complète
- Inscription et connexion sécurisées (JWT + bcrypt)
- Gestion de sessions avec cookies HTTP-only
- Protection contre les tentatives de connexion répétées
- Changement de mot de passe
- Gestion de profil utilisateur

### ✅ Gestion des Produits
- CRUD complet (Create, Read, Update, Delete)
- Support multi-langue (FR/EN)
- Recherche avancée avec filtres
- Catégories et tags (POPULAIRE, NOUVEAU, PROMOTION)
- Gestion du stock automatique
- Statistiques des produits

### ✅ Système de Commandes
- Création de commandes avec calcul automatique
- Suivi de commande par numéro
- Gestion du cycle de vie (pending → delivered)
- Historique des statuts
- Statistiques des ventes

### ✅ Sécurité
- Rate limiting (limite de requêtes)
- Helmet (headers de sécurité)
- Sanitization NoSQL
- Protection XSS et CSRF
- Validation des données
- Logs d'activités suspectes

### ✅ Internationalisation
- Support FR/EN automatique
- Détection de langue via headers/cookies
- Traductions des messages API

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0
- **npm** >= 9.0.0

## 🛠️ Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer l'environnement

Copier le fichier `.env.example` vers `.env` et configurer:

```bash
cp .env.example .env
```

Modifier les variables dans `.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/electrobenin
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
```

### 3. Démarrer MongoDB

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 4. Peupler la base de données (optionnel)

```bash
npm run seed
```

### 5. Démarrer le serveur

**Mode développement (avec nodemon):**
```bash
npm run dev
```

**Mode production:**
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 📡 Endpoints API

### Authentication (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/register` | Inscription | Public |
| POST | `/login` | Connexion | Public |
| POST | `/logout` | Déconnexion | Private |
| GET | `/me` | Profil utilisateur | Private |
| PUT | `/profile` | Mise à jour profil | Private |
| PUT | `/password` | Changer mot de passe | Private |
| DELETE | `/account` | Désactiver compte | Private |
| POST | `/check-email` | Vérifier si email existe | Public |
| POST | `/refresh-token` | Rafraîchir token | Private |

### Products (`/api/products`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste des produits | Public |
| GET | `/:id` | Détails produit | Public |
| POST | `/` | Créer produit | Admin |
| PUT | `/:id` | Modifier produit | Admin |
| DELETE | `/:id` | Supprimer produit | Admin |
| GET | `/category/:category` | Produits par catégorie | Public |
| GET | `/featured/popular` | Produits populaires | Public |
| GET | `/featured/new` | Nouveaux produits | Public |
| GET | `/featured/promotions` | Promotions | Public |
| POST | `/search` | Recherche avancée | Public |
| GET | `/stats/categories` | Statistiques catégories | Public |
| GET | `/:id/availability` | Vérifier disponibilité | Public |

### Orders (`/api/orders`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/` | Créer commande | Private |
| GET | `/my-orders` | Mes commandes | Private |
| GET | `/:id` | Détails commande | Private |
| PUT | `/:id/cancel` | Annuler commande | Private |
| GET | `/track/:orderNumber` | Suivi commande | Public |
| GET | `/` | Toutes les commandes | Admin |
| PUT | `/:id/pay` | Marquer comme payée | Admin |
| PUT | `/:id/deliver` | Marquer comme livrée | Admin |
| PUT | `/:id/status` | Changer statut | Admin |
| GET | `/stats/overview` | Statistiques | Admin |

## 🔐 Authentification

### Inscription

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "phone": "+22997123456"
}
```

### Connexion

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

### Utiliser le token

**Option 1: Header Authorization**
```bash
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

**Option 2: Cookie (automatique)**
Le token est automatiquement envoyé dans un cookie HTTP-only.

## 🌍 Internationalisation

### Changer de langue

**Option 1: Query parameter**
```bash
GET /api/products?lang=en
```

**Option 2: Header Accept-Language**
```bash
GET /api/products
Accept-Language: en
```

**Option 3: Cookie**
Le cookie `language` est automatiquement créé.

## 📦 Structure du Projet

```
electrobenin-backend/
├── config/
│   └── database.js          # Configuration MongoDB
├── controllers/
│   ├── authController.js    # Logique authentification
│   ├── productController.js # Logique produits
│   └── orderController.js   # Logique commandes
├── middleware/
│   ├── auth.js             # Protection JWT
│   ├── errorHandler.js     # Gestion erreurs
│   ├── i18n.js            # Internationalisation
│   └── security.js        # Sécurité
├── models/
│   ├── User.js            # Modèle utilisateur
│   ├── Product.js         # Modèle produit
│   └── Order.js           # Modèle commande
├── routes/
│   ├── auth.js            # Routes auth
│   ├── products.js        # Routes produits
│   └── orders.js          # Routes commandes
├── scripts/
│   └── seed.js            # Script de seed
├── utils/
│   ├── helpers.js         # Fonctions utilitaires
│   ├── jwtHelper.js       # Gestion JWT
│   └── validation.js      # Validateurs
├── .env                   # Variables d'environnement
├── .gitignore
├── index.js               # Point d'entrée
├── package.json
└── README.md
```

## 🔒 Sécurité

- ✅ Hash des mots de passe avec bcrypt (10 rounds)
- ✅ JWT avec expiration configurée
- ✅ Cookies HTTP-only et Secure en production
- ✅ Rate limiting (100 req/15min, 5 login/15min)
- ✅ Helmet pour headers de sécurité
- ✅ Sanitization contre injections NoSQL
- ✅ Protection XSS et CSRF
- ✅ Validation stricte des données
- ✅ Verrouillage de compte après tentatives échouées

## 🚀 Déploiement

### Vercel

1. Installer Vercel CLI:
```bash
npm i -g vercel
```

2. Déployer:
```bash
vercel
```

3. Configurer les variables d'environnement sur Vercel Dashboard

### Variables d'environnement en production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/electrobenin
JWT_SECRET=votre_secret_production_tres_securise
CLIENT_URL=https://electrobenin.vercel.app
```

## 🧪 Tests

```bash
npm test
```

## 📝 Licence

MIT © Kentrell Bryan

## 👨‍💻 Auteur

**Kentrell Bryan**

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📞 Support

Pour toute question, contactez: support@electrobenin.com

---

**Made with ❤️ in Bénin 🇧🇯**
