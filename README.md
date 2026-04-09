# 🏇 PRONOTURF PRO — Déploiement Netlify

## Structure du projet

```
pronoturf-netlify/
├── index.html          ← Application principale (V8.9)
├── sw.js               ← Service Worker (PWA offline)
├── manifest.json       ← Web App Manifest (installable)
├── netlify.toml        ← Config Netlify (headers, redirects)
├── icons/              ← Icônes PWA (à ajouter)
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
└── README.md
```

---

## 🚀 Déploiement rapide sur Netlify

### Option 1 — Drag & Drop (le plus simple)
1. Aller sur [app.netlify.com](https://app.netlify.com)
2. Se connecter / créer un compte gratuit
3. Glisser-déposer **le dossier entier** `pronoturf-netlify/` dans la zone de dépôt
4. ✅ Déployé en 30 secondes — Netlify fournit une URL type `https://pronoturf-xxxx.netlify.app`

### Option 2 — Via GitHub (recommandé pour mises à jour faciles)
1. Créer un repo GitHub : `pronoturf-pro`
2. Pousser le dossier :
   ```bash
   git init
   git add .
   git commit -m "PRONOTURF PRO V8.9"
   git push origin main
   ```
3. Sur Netlify → **New Site from Git** → sélectionner le repo
4. Chaque `git push` redéploie automatiquement ✅

---

## 🔗 Liens à mettre à jour dans index.html

### 1. Lien d'abonnement Stripe
Chercher dans `index.html` :
```
https://buy.stripe.com/VOTRE_LIEN_STRIPE
```
Remplacer par ton vrai lien Stripe Checkout.

### 2. Lien WhatsApp de partage
Le bouton WhatsApp utilise `https://wa.me/?text=...` — fonctionne déjà.
Pour un lien direct vers ton groupe/canal, remplacer dans `shareWA()` :
```js
window.open('https://wa.me/33XXXXXXXXX?text=...')
```

### 3. Réseaux sociaux (à ajouter)
Dans le footer ou l'onglet partage, ajouter tes liens :
- Telegram : `https://t.me/TON_CANAL`
- Instagram : `https://instagram.com/TON_COMPTE`
- TikTok : `https://tiktok.com/@TON_COMPTE`

---

## 📱 Icônes PWA

Pour que l'app soit installable sur mobile, ajouter les icônes dans `/icons/`.

### Génération rapide (gratuit) :
1. Aller sur [realfavicongenerator.net](https://realfavicongenerator.net)
2. Uploader une image carrée 🏇 (logo PRONOTURF)
3. Télécharger le pack → extraire dans `/icons/`

Ou utiliser une image emoji 🏇 comme base sur [favicon.io](https://favicon.io/emoji-favicons/horse-racing/).

---

## 🔒 Sécurité

- Le code PIN VIP est stocké dans `localStorage` — à terme, envisager une API backend
- Le PIN Admin est hardcodé `1111` → **à changer avant mise en production**
- Stripe gère les paiements de façon sécurisée (ne pas stocker de données CB)

---

## 📊 Analytics (optionnel)

Ajouter dans `<head>` de `index.html` :
```html
<!-- Netlify Analytics (payant) ou Plausible (gratuit) -->
<script defer data-domain="TON_DOMAINE.netlify.app" src="https://plausible.io/js/script.js"></script>
```

---

## 🌐 Domaine personnalisé

Sur Netlify → **Domain Settings** → Add custom domain :
- Ex : `pronoturf.fr` ou `pronoturfpro.com`
- SSL automatique (Let's Encrypt) ✅
- Redirection HTTP → HTTPS automatique ✅

---

*PRONOTURF PRO V8.9 · Dernière mise à jour : 06/04/2026*
