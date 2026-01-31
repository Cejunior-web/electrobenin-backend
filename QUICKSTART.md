# ⚡ Guide de Démarrage Rapide - ElectroBénin Backend

## 🎯 Installation en 5 minutes

### Étape 1: Cloner et installer

```bash
cd electrobenin-backend
npm install
```

### Étape 2: Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Modifier .env avec vos valeurs
# Le minimum requis:
# - MONGODB_URI
# - JWT_SECRET
```

### Étape 3: Démarrer MongoDB

```bash
# S'assurer que MongoDB est démarré
mongod
```

### Étape 4: Peupler la base (optionnel)

```bash
npm run seed
```

### Étape 5: Lancer le serveur

```bash
npm run dev
```

✅ **Le serveur est prêt sur http://localhost:5000**

---

## 🧪 Tester l'API

### 1. Vérifier la santé du serveur

```bash
curl http://localhost:5000/api/health
```

### 2. S'inscrire

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Test123"
  }'
```

### 3. Se connecter

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123"
  }'
```

Récupérez le **token** dans la réponse.

### 4. Obtenir les produits

```bash
curl http://localhost:5000/api/products
```

### 5. Obtenir son profil (avec auth)

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 🎨 Créer un admin

Par défaut, tous les utilisateurs sont des "user". Pour créer un admin:

1. Se connecter à MongoDB:
```bash
mongosh
```

2. Changer le rôle:
```javascript
use electrobenin
db.users.updateOne(
  { email: "test@test.com" },
  { $set: { role: "admin" } }
)
```

---

## 🔧 Commandes utiles

```bash
# Démarrer en mode dev
npm run dev

# Démarrer en mode production
npm start

# Peupler la base
npm run seed

# Voir les logs MongoDB
mongosh --eval "use electrobenin; db.products.find().pretty()"
```

---

## 🐛 Problèmes courants

### "MongoDB connection failed"
- Vérifier que MongoDB est démarré: `mongod`
- Vérifier l'URL dans `.env`

### "JWT_SECRET is not defined"
- Vérifier que le fichier `.env` existe
- Vérifier que `JWT_SECRET` est défini

### Port 5000 déjà utilisé
- Changer le port dans `.env`: `PORT=3000`
- Ou tuer le processus: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)

---

## 📚 Prochaines étapes

1. Lire la documentation API complète: `API.md`
2. Explorer les endpoints avec Postman/Insomnia
3. Tester la création de commandes
4. Configurer l'internationalisation

---

**Besoin d'aide? Consultez le README.md complet!**
