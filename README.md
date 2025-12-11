# Follen - Frontend Astro

Frontend moderne pour un blog utilisant Astro et Tailwind CSS, connecté à un backend Wagtail CMS.

## Déploiement de Follen sur Railway

1. **Créer un nouveau projet Railway**
2. **Connecter ce dépôt GitHub**
3. **Configurer les variables d'environnement** :
   
   | Variable | Valeur | Description |
   |----------|--------|-------------|
   | `NODE_ENV` | `production` | Mode de production |
   | `API_BASE_URL` | `https://votre-backend.railway.app` | URL du backend Wagtail |

4. **Déployer** - Railway détectera automatiquement le Dockerfile et déploiera

## Configuration

Mettez à jour l'URL de l'API dans `src/utils/api.js` pour pointer vers votre backend Wagtail.

## Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Builder pour la production
npm run build

# Prévisualiser le build
npm run preview
```

## Structure du projet

```
src/
├── components/    # Composants réutilisables
├── layouts/       # Layouts de base
├── pages/         # Pages du site
│   ├── [slug].astro       # Pages dynamiques
│   ├── articles/          # Pages des articles
│   │   └── [slug]/        # Articles individuels
│   ├── index.astro        # Page d'accueil
│   └── a-propos.astro     # Page À propos
├── styles/        # Styles globaux
└── utils/         # Fonctions utilitaires (API, etc.)
```

## Fonctionnalités

- **Pages dynamiques** : Chargement du contenu depuis l'API Wagtail
- **Design responsive** : Adapté à tous les appareils
- **Navigation intuitive** : Menu de navigation complet
- **Affichage des articles** : Liste et détails des articles de blog
- **Pages statiques** : Support pour les pages statiques (À propos, Contact, etc.)

## Intégration avec Wagtail

Le frontend se connecte à l'API Wagtail pour récupérer :

- La page d'accueil avec ses sections promotionnelles
- La liste des articles de blog
- Les détails des articles individuels
- Les pages statiques

## Personnalisation

- **Styles** : Modifier les styles dans `tailwind.config.js` et les fichiers CSS
- **Composants** : Ajouter ou modifier des composants dans `src/components/`
- **Layouts** : Personnaliser les layouts dans `src/layouts/`
- **Pages** : Créer de nouvelles pages dans `src/pages/`

## Dépendances principales

- **Astro** : Framework moderne pour les sites statiques
- **Tailwind CSS** : Framework CSS utilitaire
- **marked** : Pour le rendu du contenu riche
- **Docker** : Pour le déploiement sur Railway

## Licence

MIT