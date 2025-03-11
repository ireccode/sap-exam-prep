# Build stage for Vite app
FROM node:20-alpine as build

# Define build arguments
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PREMIUM_PRICE_ID
ARG VITE_BASIC_ENCRYPTION_KEY
ARG VITE_PREMIUM_ENCRYPTION_KEY
ARG VITE_WEBHOOK_SECRET
ARG VITE_OPENROUTER_API_KEY

# Set build time environment variables
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY} \
    VITE_STRIPE_PREMIUM_PRICE_ID=${VITE_STRIPE_PREMIUM_PRICE_ID} \
    VITE_BASIC_ENCRYPTION_KEY=${VITE_BASIC_ENCRYPTION_KEY} \
    VITE_PREMIUM_ENCRYPTION_KEY=${VITE_PREMIUM_ENCRYPTION_KEY} \
    VITE_WEBHOOK_SECRET=${VITE_WEBHOOK_SECRET} \
    VITE_OPENROUTER_API_KEY=${VITE_OPENROUTER_API_KEY}

WORKDIR /app    

# Copy package files and install dependencies
COPY package*.json ./
COPY src/env-config.js.template /app/public/
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Debug: Show copied files after build
RUN echo "Files in dist directory:" && ls -la dist/

# Vite app production stage
FROM node:20-alpine as app

WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/public/env-config.js.template /app/public/

# Install serve to run the production build
RUN npm install -g serve

# Create directory for secrets and data
RUN mkdir -p /run/secrets \
    && mkdir -p /app/data \
    && mkdir -p /var/log/nginx

# Create entrypoint script for Vite app with secret handling
RUN echo '#!/bin/sh' > /start-app.sh && \
    echo 'set -e' >> /start-app.sh && \
    echo '# First try to read from Docker secrets' >> /start-app.sh && \
    echo 'for secret_file in /run/secrets/*; do' >> /start-app.sh && \
    echo '  if [ -f "$secret_file" ]; then' >> /start-app.sh && \
    echo '    secret_name=$(basename "$secret_file")' >> /start-app.sh && \
    echo '    export "$secret_name"="$(cat $secret_file)"' >> /start-app.sh && \
    echo '  fi' >> /start-app.sh && \
    echo 'done' >> /start-app.sh && \
    echo '# Then try to read from environment variable files' >> /start-app.sh && \
    echo 'for env_file in VITE_SUPABASE_URL_FILE VITE_SUPABASE_ANON_KEY_FILE VITE_STRIPE_PUBLISHABLE_KEY_FILE VITE_STRIPE_PREMIUM_PRICE_ID_FILE VITE_BASIC_ENCRYPTION_KEY_FILE VITE_PREMIUM_ENCRYPTION_KEY_FILE VITE_WEBHOOK_SECRET_FILE VITE_OPENROUTER_API_KEY_FILE; do' >> /start-app.sh && \
    echo '  if [ ! -z "${!env_file}" ] && [ -f "${!env_file}" ]; then' >> /start-app.sh && \
    echo '    secret_name=$(echo "$env_file" | sed "s/_FILE$//")'  >> /start-app.sh && \
    echo '    export "$secret_name"="$(cat ${!env_file})"' >> /start-app.sh && \
    echo '  fi' >> /start-app.sh && \
    echo 'done' >> /start-app.sh && \
    echo 'envsubst < /app/public/env-config.js.template > /app/dist/env-config.js' >> /start-app.sh && \
    echo 'serve -s dist -l 5173' >> /start-app.sh && \
    chmod +x /start-app.sh

EXPOSE 5173
CMD ["/start-app.sh"]

# Nginx load balancer stage
FROM nginx:alpine as nginx

# Install required tools
RUN apk add --no-cache gettext openssl curl bind-tools certbot certbot-nginx

# Create required directories
RUN mkdir -p /var/www/certbot \
    && mkdir -p /etc/letsencrypt \
    && mkdir -p /docker-entrypoint.d

# Copy nginx configuration and init script
COPY examprep_app_nginx.conf /etc/nginx/conf.d/default.conf
COPY init-certs.sh /docker-entrypoint.d/init-certs.sh
RUN chmod +x /docker-entrypoint.d/init-certs.sh

# Create entrypoint script for Nginx
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '/docker-entrypoint.d/init-certs.sh' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Add health check for Nginx
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80 443
CMD ["/docker-entrypoint.sh"]