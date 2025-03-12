# Build stage for Vite app
FROM node:20-alpine as build

WORKDIR /app    

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and environment file
COPY . .

# Build-time arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PREMIUM_PRICE_ID
ARG VITE_BASIC_ENCRYPTION_KEY
ARG VITE_PREMIUM_ENCRYPTION_KEY
ARG VITE_WEBHOOK_SECRET
ARG VITE_OPENROUTER_API_KEY

# Make ARG values available during build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
ENV VITE_STRIPE_PREMIUM_PRICE_ID=${VITE_STRIPE_PREMIUM_PRICE_ID}
ENV VITE_BASIC_ENCRYPTION_KEY=${VITE_BASIC_ENCRYPTION_KEY}
ENV VITE_PREMIUM_ENCRYPTION_KEY=${VITE_PREMIUM_ENCRYPTION_KEY}
ENV VITE_WEBHOOK_SECRET=${VITE_WEBHOOK_SECRET}
ENV VITE_OPENROUTER_API_KEY=${VITE_OPENROUTER_API_KEY}

# Create a .env file for the build
RUN echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" > .env && \
    echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env && \
    echo "VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}" >> .env && \
    echo "VITE_STRIPE_PREMIUM_PRICE_ID=${VITE_STRIPE_PREMIUM_PRICE_ID}" >> .env && \
    echo "VITE_BASIC_ENCRYPTION_KEY=${VITE_BASIC_ENCRYPTION_KEY}" >> .env && \
    echo "VITE_PREMIUM_ENCRYPTION_KEY=${VITE_PREMIUM_ENCRYPTION_KEY}" >> .env && \
    echo "VITE_WEBHOOK_SECRET=${VITE_WEBHOOK_SECRET}" >> .env && \
    echo "VITE_OPENROUTER_API_KEY=${VITE_OPENROUTER_API_KEY}" >> .env

# Build the application
RUN npm run build

# Debug: Show copied files after build
RUN echo "Files in dist directory:" && ls -la dist/

# Vite app production stage
FROM node:20-alpine as app

WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/.env /app/.env

# Install required packages
RUN apk add --no-cache gettext

# Create entrypoint script with environment file handling
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo 'if [ -f "/app/.env" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Using production environment file"' >> /app/entrypoint.sh && \
    echo '  set -a' >> /app/entrypoint.sh && \
    echo '  . /app/.env' >> /app/entrypoint.sh && \
    echo '  set +a' >> /app/entrypoint.sh && \
    echo 'else' >> /app/entrypoint.sh && \
    echo '  echo "Warning: Production environment file not found at /app/.env"' >> /app/entrypoint.sh && \
    echo '  echo "Using default environment variables"' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'exec serve -s dist -l tcp://0.0.0.0:5173' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Install dependencies and serve
RUN npm install && \
    npm install -g serve

# Create directory for data and logs
RUN mkdir -p /app/data \
    && mkdir -p /var/log/nginx

EXPOSE 5173
# Use the entrypoint script
CMD ["/app/entrypoint.sh"]

# Nginx load balancer stage
FROM nginx:alpine as nginx

# Install required tools
RUN apk add --no-cache gettext openssl curl bind-tools certbot certbot-nginx

# Create required directories
RUN mkdir -p /var/www/certbot \
    && mkdir -p /etc/letsencrypt \
    && mkdir -p /docker-entrypoint.d \
    && mkdir -p /usr/share/nginx/html

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
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider --timeout=1 --user-agent="Docker-Healthcheck" http://localhost:80/ || exit 1

EXPOSE 80 443
CMD ["/docker-entrypoint.sh"]