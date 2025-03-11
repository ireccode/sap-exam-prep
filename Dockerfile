# Build stage for Vite app
FROM node:20-alpine as build

WORKDIR /app    

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and environment file
COPY . .

# Build the application with environment variables from build args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PREMIUM_PRICE_ID
ARG VITE_BASIC_ENCRYPTION_KEY
ARG VITE_PREMIUM_ENCRYPTION_KEY
ARG VITE_WEBHOOK_SECRET
ARG VITE_OPENROUTER_API_KEY

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
ENV VITE_STRIPE_PREMIUM_PRICE_ID=${VITE_STRIPE_PREMIUM_PRICE_ID}
ENV VITE_BASIC_ENCRYPTION_KEY=${VITE_BASIC_ENCRYPTION_KEY}
ENV VITE_PREMIUM_ENCRYPTION_KEY=${VITE_PREMIUM_ENCRYPTION_KEY}
ENV VITE_WEBHOOK_SECRET=${VITE_WEBHOOK_SECRET}
ENV VITE_OPENROUTER_API_KEY=${VITE_OPENROUTER_API_KEY}

# Build the application
RUN npm run build

# Debug: Show copied files after build
RUN echo "Files in dist directory:" && ls -la dist/

# Vite app production stage
FROM node:20-alpine as app

WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package*.json ./

# Install required packages
RUN apk add --no-cache gettext

# Create a default .env file (will be overwritten by mounted file)
RUN echo "# Default environment file - override with actual values" > /app/.env && \
    echo "VITE_SUPABASE_URL=https://your-supabase-project-url.supabase.co" >> /app/.env && \
    echo "VITE_SUPABASE_ANON_KEY=your-supabase-anon-key" >> /app/.env

# Create entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo 'if [ -f "/app/data/.env.production" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Using .env.production from data volume"' >> /app/entrypoint.sh && \
    echo '  set -a' >> /app/entrypoint.sh && \
    echo '  . /app/data/.env.production' >> /app/entrypoint.sh && \
    echo '  set +a' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'exec serve -s dist -l tcp://0.0.0.0:5173' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Install dependencies and serve
RUN npm install && \
    npm install -g serve

# Create directory for data
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

# Copy the built files from the build stage to Nginx's html directory
COPY --from=build /app/dist /usr/share/nginx/html

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