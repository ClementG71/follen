# ===========================================
# Dockerfile pour Follen - Optimisé pour Dokploy
# ===========================================

# Étape 1 : Build
FROM node:20-alpine AS builder

# Dépendances pour Pagefind (libc compatible)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Configuration npm pour réseau instable + installation avec retries
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --prefer-offline --no-audit

# Copier le code source
COPY . .

# Builder l'application Astro (inclut postbuild pour Pagefind)
RUN npm run build

# ===========================================
# Étape 2 : Production
FROM node:20-alpine AS runner

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 astro

# Copier les fichiers buildés
COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=builder --chown=astro:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=astro:nodejs /app/package.json ./

# Variables d'environnement
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Changer vers l'utilisateur non-root
USER astro

# Exposer le port
EXPOSE 4321

# Démarrer l'application
CMD ["node", "./dist/server/entry.mjs"]
