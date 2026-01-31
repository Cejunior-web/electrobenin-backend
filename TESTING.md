# 🧪 Guide de Test Local - ElectroBénin Backend

Ce guide vous aide à tester complètement le backend **AVANT** de déployer sur Vercel.

---

## ✅ CHECKLIST AVANT DE TESTER

- [ ] Node.js installé (>= 18.0.0)
- [ ] MongoDB installé et démarré
- [ ] npm install exécuté
- [ ] Fichier .env configuré
- [ ] Base de données peuplée (npm run seed)

---

## 🚀 DÉMARRAGE

### 1. Démarrer MongoDB

```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod

# Vérifier que MongoDB est actif
mongosh --eval "db.version()"
```

### 2. Démarrer le serveur

```bash
npm run dev
```

Vérifier la console :
```
✅ ELECTROBENIN API - SERVEUR DÉMARRÉ
✅ MongoDB connecté avec succès!
🚀 Serveur: http://localhost:5000
```

---

## 🧪 TESTS MANUELS

### Test 1 : Santé de l'API

```bash
curl http://localhost:5000/api/health
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "API ElectroBénin fonctionne correctement",
  "timestamp": "2026-01-29T...",
  "environment": "development"
}
```

✅ **PASS** si vous obtenez success: true

---

### Test 2 : Inscription

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "Test123",
    "phone": "+22997123456"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "user": { 
      "id": "...",
      "name": "John Doe",
      "email": "john@test.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

✅ **PASS** si vous recevez un token

**Sauvegarder le token pour les tests suivants !**

---

### Test 3 : Connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "Test123"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

✅ **PASS** si connexion réussie

---

### Test 4 : Obtenir son profil (avec auth)

```bash
# Remplacer YOUR_TOKEN par le token obtenu
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Profil récupéré",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@test.com",
      "role": "user"
    }
  }
}
```

✅ **PASS** si profil retourné

---

### Test 5 : Lister les produits

```bash
curl http://localhost:5000/api/products
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Produits récupérés",
  "data": {
    "products": [ ... ],
    "pagination": { ... }
  }
}
```

✅ **PASS** si liste de produits retournée

---

### Test 6 : Rechercher un produit

```bash
curl "http://localhost:5000/api/products?search=arduino"
```

✅ **PASS** si produits Arduino retournés

---

### Test 7 : Produits par catégorie

```bash
curl "http://localhost:5000/api/products?category=Microcontrôleurs"
```

✅ **PASS** si seulement les microcontrôleurs sont retournés

---

### Test 8 : Obtenir un produit spécifique

```bash
# D'abord obtenir l'ID d'un produit
curl http://localhost:5000/api/products | grep "_id"

# Puis obtenir ce produit (remplacer PRODUCT_ID)
curl http://localhost:5000/api/products/PRODUCT_ID
```

✅ **PASS** si détails du produit retournés

---

### Test 9 : Créer une commande (nécessite auth)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "product": "PRODUCT_ID",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullName": "John Doe",
      "phone": "+22997123456",
      "street": "123 Rue Example",
      "city": "Cotonou"
    },
    "paymentMethod": "cash_on_delivery"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "order": {
      "orderNumber": "EB260129...",
      "status": "pending",
      ...
    }
  }
}
```

✅ **PASS** si commande créée
✅ **BONUS** : Vérifier que le stock du produit a diminué

---

### Test 10 : Mes commandes

```bash
curl http://localhost:5000/api/orders/my-orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ **PASS** si la commande créée apparaît

---

### Test 11 : Suivi de commande (public)

```bash
# Utiliser le orderNumber de la commande créée
curl http://localhost:5000/api/orders/track/EB260129XXXX
```

✅ **PASS** si statut de commande retourné

---

### Test 12 : Internationalisation (FR/EN)

```bash
# Produits en français
curl http://localhost:5000/api/products?lang=fr

# Produits en anglais
curl http://localhost:5000/api/products?lang=en
```

✅ **PASS** si les noms/descriptions changent de langue

---

### Test 13 : Rate Limiting

```bash
# Exécuter cette commande 10 fois rapidement
for i in {1..10}; do
  curl http://localhost:5000/api/products
  echo "Request $i"
done
```

✅ **PASS** si après ~100 requêtes, vous recevez "Too many requests"

---

### Test 14 : Validation des données

```bash
# Tenter une inscription avec email invalide
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "email-invalide",
    "password": "123"
  }'
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Erreurs de validation",
  "errors": [ ... ]
}
```

✅ **PASS** si erreurs de validation retournées

---

### Test 15 : Accès non autorisé

```bash
# Tenter d'accéder au profil sans token
curl http://localhost:5000/api/auth/me
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Accès non autorisé. Veuillez vous connecter."
}
```

✅ **PASS** si erreur 401

---

## 🎯 TESTS ADMIN (Optionnel)

### 1. Créer un admin

```bash
# Se connecter à MongoDB
mongosh

# Dans mongosh
use electrobenin
db.users.updateOne(
  { email: "john@test.com" },
  { $set: { role: "admin" } }
)
```

### 2. Créer un produit (Admin)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": {
      "fr": "Nouveau Produit",
      "en": "New Product"
    },
    "description": {
      "fr": "Description en français",
      "en": "Description in English"
    },
    "price": 5000,
    "stock": 10,
    "category": "Modules",
    "image": "https://example.com/image.jpg"
  }'
```

✅ **PASS** si produit créé

---

## 📊 VÉRIFICATION BASE DE DONNÉES

```bash
# Se connecter à MongoDB
mongosh

# Vérifier les collections
use electrobenin
show collections

# Vérifier les utilisateurs
db.users.find().pretty()

# Vérifier les produits
db.products.find().pretty()

# Vérifier les commandes
db.orders.find().pretty()
```

---

## ✅ CHECKLIST FINALE AVANT DÉPLOIEMENT

- [ ] Tous les tests ci-dessus PASSENT
- [ ] Aucune erreur dans la console du serveur
- [ ] MongoDB se connecte correctement
- [ ] Les tokens JWT sont générés
- [ ] Les mots de passe sont hashés (vérifier dans MongoDB)
- [ ] Rate limiting fonctionne
- [ ] Validation des données fonctionne
- [ ] Internationalisation FR/EN fonctionne
- [ ] Le stock diminue après commande
- [ ] Les routes protégées nécessitent auth

---

## 🐛 SI UN TEST ÉCHOUE

### Erreur de connexion MongoDB
```bash
# Vérifier que MongoDB est actif
mongosh --eval "db.version()"

# Redémarrer MongoDB si nécessaire
sudo systemctl restart mongod
```

### Erreur "JWT_SECRET is not defined"
```bash
# Vérifier le fichier .env
cat .env | grep JWT_SECRET

# Si absent, l'ajouter
echo 'JWT_SECRET=votre_secret_ici' >> .env
```

### Port 5000 déjà utilisé
```bash
# Changer le port dans .env
echo 'PORT=3000' >> .env
```

---

## 🎉 TOUS LES TESTS PASSENT ?

**Félicitations ! Votre backend est prêt pour le déploiement sur Vercel ! 🚀**

**Prochaine étape :** Lire `DEPLOYMENT.md`

---

**Temps estimé des tests : 15-20 minutes**
