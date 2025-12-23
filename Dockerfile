# ===========================================
# Dockerfile pour Follen - Optimisé pour Dokploy
# ===========================================

# Étape 1 : Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (incluant devDependencies pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Builder l'application Astro
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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4321/ || exit 1

# Démarrer l'application
CMD ["node", "./dist/server/entry.mjs"]
