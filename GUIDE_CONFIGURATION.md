# 🚀 GUIDE CONFIGURATION — PRONOTURF PRO
## Gestion automatique des abonnés
### Temps total : ~30 minutes

---

## ÉTAPE 1 — AIRTABLE (ta base de données abonnés)

### 1.1 Créer le compte
→ https://airtable.com → Sign up gratuit

### 1.2 Créer une base
- Clique **+ Create a base** → "Blank base"
- Nomme-la : **PRONOTURF**

### 1.3 Créer la table "Abonnés"
Renomme la première table en **Abonnés** puis crée ces colonnes exactement :

| Nom de la colonne | Type Airtable |
|-------------------|---------------|
| Email             | Email         |
| PIN               | Single line text |
| Stripe_ID         | Single line text |
| Abonnement_ID     | Single line text |
| Statut            | Single select → options: Actif / Annulé / Paiement échoué |
| Date_debut        | Date          |
| Date_fin          | Date          |
| Plan              | Single line text |
| Notes             | Single line text |

### 1.4 Récupérer tes clés Airtable
1. Va sur https://airtable.com/account
2. **API key** → copie ta clé personnelle (commence par "pat")
3. **Base ID** → ouvre ta base → dans l'URL tu verras : `airtable.com/appXXXXXXXX/...`
   → Le Base ID = `appXXXXXXXX`

---

## ÉTAPE 2 — EMAILJS (envoi automatique des emails)

### 2.1 Créer le compte
→ https://emailjs.com → Sign up gratuit (200 emails/mois gratuit)

### 2.2 Connecter ton email
- Tableau de bord → **Email Services** → **Add New Service**
- Choisis **Gmail** (ou autre)
- Connecte ton compte email (ex: pronoturfpro@gmail.com)
- Note le **Service ID** (ex: `service_abc123`)

### 2.3 Créer le template "Bienvenue + PIN"
- **Email Templates** → **Create New Template**
- **Template Name** : Bienvenue VIP
- **Subject** : 🏇 Ton accès PRONOTURF PRO · Code PIN {{pin_code}}
- **Content** (copie-colle ce texte) :

```
Bonjour !

Bienvenue dans PRONOTURF PRO 🏇

Ton abonnement VIP est actif. Voici ton code d'accès personnel :

━━━━━━━━━━━━━━━
🔐 TON CODE PIN : {{pin_code}}
━━━━━━━━━━━━━━━

Pour accéder à l'application :
1. Va sur {{app_url}}
2. Clique sur l'onglet 💎 VIP
3. Saisis ton code PIN : {{pin_code}}

Tes tickets du jour t'attendent !

📊 CDJ 80% · P&L +165€ · ROI 82.1%

Des questions ? Réponds à cet email.
→ {{support_email}}

🏇 PRONOTURF PRO
⚠️ Ce code est personnel, ne le partage pas.
```

- Note le **Template ID** (ex: `template_xyz789`)

### 2.4 Créer le template "Annulation" (optionnel)
- **Email Templates** → **Create New Template**
- **Template Name** : Annulation abonnement
- **Subject** : 😔 Ton abonnement PRONOTURF PRO a été annulé
- **Content** :

```
Bonjour,

Ton abonnement PRONOTURF PRO a été annulé.

Ton accès VIP restera actif jusqu'à la fin de la période payée.

Si c'est une erreur ou tu souhaites te réabonner :
→ {{app_url}}

À bientôt sur les hippodromes ! 🏇
→ {{support_email}}
```

### 2.5 Récupérer tes clés EmailJS
- **Account** → **API Keys**
- **Public Key** (ex: `user_AbCdEfGh`)
- **Private Key** (ex: `pk_AbCdEfGh123`)

---

## ÉTAPE 3 — STRIPE WEBHOOK

### 3.1 Configurer le webhook
1. Va sur https://dashboard.stripe.com/webhooks
2. **Add endpoint**
3. **URL** : `https://pronoturfpro.fr/.netlify/functions/stripe-webhook`
   (remplace pronoturfprov2 par ton URL Netlify)
4. **Events à écouter** — sélectionne ces 4 :
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Add endpoint** → copie le **Signing secret** (commence par `whsec_`)

---

## ÉTAPE 4 — VARIABLES D'ENVIRONNEMENT NETLIFY

### 4.1 Accéder aux variables
1. Va sur https://app.netlify.com → ton site
2. **Site configuration** → **Environment variables** → **Add a variable**

### 4.2 Ajouter ces 8 variables exactement :

| Nom de la variable          | Valeur                              |
|-----------------------------|-------------------------------------|
| STRIPE_WEBHOOK_SECRET       | whsec_XXXX (copié depuis Stripe)    |
| AIRTABLE_API_KEY            | pat_XXXX (copié depuis Airtable)    |
| AIRTABLE_BASE_ID            | appXXXXX (copié depuis l'URL Airtable) |
| AIRTABLE_TABLE_NAME         | Abonnés                             |
| EMAILJS_SERVICE_ID          | service_XXXX                        |
| EMAILJS_TEMPLATE_ID         | template_XXXX (bienvenue)           |
| EMAILJS_TEMPLATE_ANNULATION_ID | template_XXXX (annulation)       |
| EMAILJS_PUBLIC_KEY          | user_XXXX                           |
| EMAILJS_PRIVATE_KEY         | pk_XXXX                             |
| ADMIN_SECRET                | ton-mot-de-passe-admin (choisis !)  |

### 4.3 Redéployer
- **Deploys** → **Trigger deploy** → **Deploy site**

---

## ÉTAPE 5 — TESTER

### 5.1 Test du webhook
Dans Stripe Dashboard → Webhooks → ton endpoint → **Send test event**
→ Envoie `customer.subscription.created`
→ Vérifie dans Airtable qu'un abonné test a été créé

### 5.2 Test du PIN
- Dans l'app → onglet 💎 VIP → entre le PIN créé
- Si ça marche → ✅ tout est connecté !

### 5.3 Test admin
- Dans l'app → onglet ⚙️ Admin → entre le mot de passe admin
- Clique "Charger les abonnés" → tu devrais voir la liste

---

## RÉSUMÉ DU FLUX AUTOMATIQUE

```
Client clique "S'abonner" (Stripe)
         ↓
Client paye (carte bancaire)
         ↓
Stripe envoie webhook à Netlify
         ↓
Netlify génère PIN unique (ex: 4782)
         ↓
PIN sauvegardé dans Airtable ← tu peux le voir !
         ↓
Email envoyé au client avec son PIN (EmailJS)
         ↓
Client ouvre l'app → entre son PIN → Accès VIP ✅
         ↓
Si annulation Stripe → PIN désactivé → Email envoyé
```

---

## 📞 SUPPORT

Si tu bloques sur une étape, note :
- L'étape exacte (ex: "Étape 3.1")
- Le message d'erreur exact
- Le service concerné (Airtable / EmailJS / Stripe / Netlify)

*PRONOTURF PRO · Guide V1.0 · Avril 2026*
