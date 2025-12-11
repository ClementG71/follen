# Dockerfile pour Follen (Astro frontend) sur Railway

# Utiliser une image Node.js officielle (version 20 pour la compatibilité avec marked@17)
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste de l'application
COPY . .

# Builder l'application
RUN npm run build

# Installer un serveur web pour servir les fichiers statiques
RUN npm install -g serve

# Exposer le port (Railway utilise la variable PORT)
EXPOSE $PORT

# Commande pour démarrer l'application
CMD ["serve", "-s", "dist", "-l", "$PORT"]