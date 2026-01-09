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
    # Optimisations performances \
    sendfile on; \
    tcp_nopush on; \
    tcp_nodelay on; \
    keepalive_timeout 65; \
    types_hash_max_size 2048; \
    \
    # Compression gzip agressive \
    gzip on; \
    gzip_vary on; \
    gzip_proxied any; \
    gzip_comp_level 6; \
    gzip_buffers 16 8k; \
    gzip_http_version 1.1; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml; \
    \
    # Cache agressif pour les assets hashés (immutable) \
    location /_astro/ { \
        expires max; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Cache pour Pagefind \
    location /_pagefind/ { \
        expires 1d; \
        add_header Cache-Control "public"; \
    } \
    \
    # Gestion propre des URL sans extension (.html) \
    location / { \
        try_files $uri $uri/index.html $uri.html /index.html; \
    } \
    \
    # Gestion des erreurs 404 \
    error_page 404 /404.html; \
}' > /etc/nginx/conf.d/default.conf

# Exposer le port 4321
EXPOSE 4321

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
