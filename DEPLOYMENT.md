# 🚀 Guide de Déploiement Vercel - ElectroBénin

## 📋 Prérequis

1. Compte Vercel (gratuit) : https://vercel.com
2. MongoDB Atlas (gratuit) : https://www.mongodb.com/cloud/atlas
3. Code source ElectroBénin backend

---

## PARTIE 1 : CONFIGURATION MONGODB ATLAS

### Étape 1 : Créer un cluster MongoDB Atlas

1. Aller sur https://www.mongodb.com/cloud/atlas
2. Se connecter ou créer un compte
3. Cliquer sur **"Build a Database"**
4. Choisir **"M0 Free"** (gratuit)
5. Sélectionner une région proche du Bénin (ex: Europe ou Afrique du Sud)
6. Cliquer sur **"Create Cluster"**

### Étape 2 : Configurer l'accès

1. **Network Access** (Autoriser Vercel)
   - Aller dans "Network Access" (menu latéral)
   - Cliquer "Add IP Address"
   - Sélectionner **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Confirmer

2. **Database Access** (Créer un utilisateur)
   - Aller dans "Database Access"
   - Cliquer "Add New Database User"
   - Choisir "Password" authentication
   - Username: `electrobenin`
   - Password: Générer un mot de passe fort (noter quelque part)
   - Role: **"Atlas Admin"** ou **"Read and Write to any database"**
   - Cliquer "Add User"

### Étape 3 : Obtenir l'URI de connexion

1. Retourner sur "Database" (menu principal)
2. Cliquer sur **"Connect"** sur votre cluster
3. Choisir **"Connect your application"**
4. Copier l'URI de connexion (format: `mongodb+srv://...`)
5. Remplacer `<password>` par le mot de passe créé
6. Remplacer `<dbname>` par `electrobenin`

**Exemple d'URI :**
```
mongodb+srv://electrobenin:MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/electrobenin?retryWrites=true&w=majority
```

⚠️ **CONSERVER CET URI EN SÉCURITÉ !**

---

## PARTIE 2 : CONFIGURATION VERCEL

### Étape 1 : Préparer le projet

1. **Créer un fichier `vercel.json`** à la racine du projet :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "index.js"
    },
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Mettre à jour `package.json`** (vérifier les scripts) :

```json
{
  "scripts": {
    "start": "node index.js",
    "build": "echo 'Build complete'"
  }
}
```

### Étape 2 : Déployer sur Vercel

#### Option A : Via le site web (RECOMMANDÉ)

1. Aller sur https://vercel.com
2. Se connecter avec GitHub/GitLab/Bitbucket
3. Cliquer **"Add New Project"**
4. Importer votre repository Git
5. Configurer :
   - **Framework Preset**: Other
   - **Root Directory**: `./` (racine)
   - **Build Command**: `npm install`
   - **Output Directory**: laisser vide

#### Option B : Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Suivre les instructions
```

### Étape 3 : Configurer les variables d'environnement

1. Sur le dashboard Vercel, aller dans votre projet
2. Cliquer sur **"Settings"**
3. Aller dans **"Environment Variables"**
4. Ajouter les variables suivantes :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `NODE_ENV` | `production` | Production |
| `MONGODB_URI` | `mongodb+srv://...` (votre URI Atlas) | Production |
| `JWT_SECRET` | Générer une clé aléatoire forte | Production |
| `JWT_EXPIRE` | `7d` | Production |
| `JWT_COOKIE_EXPIRE` | `7` | Production |
| `CLIENT_URL` | URL de votre frontend Vercel | Production |
| `BCRYPT_ROUNDS` | `10` | Production |

**Générer JWT_SECRET sécurisé :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

5. Cliquer **"Save"**

### Étape 4 : Redéployer

1. Cliquer sur **"Deployments"**
2. Cliquer sur **"Redeploy"** sur le dernier déploiement
3. Attendre la fin du build

---

## PARTIE 3 : TESTER LE DÉPLOIEMENT

### Étape 1 : Vérifier la santé de l'API

```bash
curl https://votre-app.vercel.app/api/health
```

Réponse attendue :
```json
{
  "success": true,
  "message": "API ElectroBénin fonctionne correctement",
  "timestamp": "2026-01-29T...",
  "environment": "production"
}
```

### Étape 2 : Tester l'inscription

```bash
curl -X POST https://votre-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123"
  }'
```

### Étape 3 : Tester les produits

```bash
curl https://votre-app.vercel.app/api/products
```

---

## PARTIE 4 : PEUPLER LA BASE DE DONNÉES

### Option A : Depuis votre machine locale

1. Mettre à jour `.env` avec l'URI MongoDB Atlas
2. Lancer le script :

```bash
npm run seed
```

### Option B : Créer un endpoint admin temporaire

1. Ajouter une route temporaire dans `index.js` :

```javascript
// TEMPORAIRE - À SUPPRIMER APRÈS SEED
app.get('/api/admin/seed', async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    return res.status(403).json({ message: 'Disabled in production' });
  }
  // Exécuter le seed
  require('./scripts/seed');
  res.json({ message: 'Database seeded' });
});
```

2. Accéder à : `https://votre-app.vercel.app/api/admin/seed`
3. **SUPPRIMER CETTE ROUTE ENSUITE !**

---

## PARTIE 5 : CONFIGURATION DU FRONTEND

### Mettre à jour les URLs API dans le frontend

Dans vos fichiers frontend (script.js, etc.), mettre à jour :

```javascript
// Avant (développement)
const API_URL = 'http://localhost:5000/api';

// Après (production)
const API_URL = 'https://votre-backend.vercel.app/api';

// Mieux : Détection automatique
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://votre-backend.vercel.app/api';
```

---

## 🔒 SÉCURITÉ EN PRODUCTION

### Checklist sécurité

- ✅ JWT_SECRET différent de développement
- ✅ MongoDB URI sécurisé (pas dans le code)
- ✅ CORS configuré avec CLIENT_URL spécifique
- ✅ Rate limiting activé
- ✅ Helmet configuré
- ✅ Variables d'environnement dans Vercel (pas dans .env)

### Recommandations

1. **Ne JAMAIS commit le fichier .env**
2. **Changer JWT_SECRET régulièrement**
3. **Surveiller les logs MongoDB Atlas**
4. **Activer les alertes Vercel**
5. **Backup MongoDB régulier**

---

## 🐛 PROBLÈMES COURANTS

### Erreur : "Cannot connect to MongoDB"

**Solution :**
1. Vérifier que l'IP 0.0.0.0/0 est autorisée dans MongoDB Atlas
2. Vérifier que MONGODB_URI est correcte dans Vercel
3. Vérifier que le mot de passe ne contient pas de caractères spéciaux (ou les encoder)

### Erreur : "JWT_SECRET is not defined"

**Solution :**
1. Aller dans Vercel > Settings > Environment Variables
2. Ajouter JWT_SECRET
3. Redéployer

### Erreur : "CORS policy"

**Solution :**
1. Mettre à jour CLIENT_URL dans Vercel
2. Vérifier le middleware CORS dans `index.js`

### Erreur : "Function execution timed out"

**Solution :**
Vercel Free a une limite de 10 secondes. Si une requête prend trop de temps :
1. Optimiser les queries MongoDB (indexes)
2. Réduire la pagination (limit)
3. Upgrade vers Vercel Pro si nécessaire

---

## 📊 MONITORING

### Vercel Analytics

1. Aller dans votre projet Vercel
2. Onglet **"Analytics"**
3. Activer les analytics (gratuit)

### MongoDB Atlas Monitoring

1. Dashboard MongoDB Atlas
2. Onglet **"Metrics"**
3. Surveiller :
   - Connexions
   - Opérations
   - Storage

---

## 🎯 PROCHAINES ÉTAPES

### Après le déploiement

1. ✅ Tester tous les endpoints
2. ✅ Créer un utilisateur admin
3. ✅ Peupler la base avec les produits
4. ✅ Connecter le frontend
5. ✅ Configurer un nom de domaine personnalisé (optionnel)

### Configuration domaine personnalisé

1. Vercel Dashboard > votre projet > Settings > Domains
2. Ajouter votre domaine (ex: api.electrobenin.com)
3. Configurer les DNS selon les instructions Vercel

---

## 📞 SUPPORT

- **Documentation Vercel**: https://vercel.com/docs
- **Documentation MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Support Vercel**: https://vercel.com/support

---

## 🎉 FÉLICITATIONS !

Votre backend ElectroBénin est maintenant en production sur Vercel ! 🚀

**URLs à retenir :**
- API: `https://votre-app.vercel.app/api`
- Health: `https://votre-app.vercel.app/api/health`
- Docs: `https://votre-app.vercel.app/api` (si vous ajoutez une page de docs)

---

**Made with ❤️ for ElectroBénin 🇧🇯**
