# ===========================================
# Dockerfile pour Follen - SSG avec Nginx
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
# Étape 2 : Production avec Nginx
FROM nginx:alpine AS runner

# Copier les fichiers statiques buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration nginx pour SPA/routes Astro
RUN echo 'server { \
    listen 4321; \
    listen [::]:4321; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Compression gzip \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml; \
    \
    # Cache des assets statiques \
    location /_astro/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    location /_pagefind/ { \
        expires 1d; \
        add_header Cache-Control "public"; \
    } \
    \
    # Fallback pour les routes Astro \
    location / { \
        try_files $uri $uri/ $uri.html /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exposer le port 4321
EXPOSE 4321

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
