# Build stage for Vite app
FROM node:20-alpine as build

WORKDIR /app    

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Debug: Show copied files after build
RUN echo "Files in dist directory:" && ls -la dist/

# Nginx stage
FROM nginx:alpine

# Install required tools
RUN apk add --no-cache gettext openssl curl bind-tools certbot certbot-nginx

# Create required directories
RUN mkdir -p /var/www/certbot \
    && mkdir -p /etc/letsencrypt \
    && mkdir -p /docker-entrypoint.d \
    && mkdir -p /usr/share/nginx/html

# Copy nginx configuration template and init script
COPY examprep_app_nginx.conf.template /etc/nginx/templates/default.conf.template
COPY init-certs.sh /docker-entrypoint.d/init-certs.sh
RUN chmod +x /docker-entrypoint.d/init-certs.sh

# Copy built files from build stage to Nginx HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

# Set proper permissions for Nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create entrypoint script for Nginx
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '# Set default values for environment variables' >> /docker-entrypoint.sh && \
    echo 'export VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-https://cwscaerzmixftirytvwo.supabase.co}' >> /docker-entrypoint.sh && \
    echo 'export SUPABASE_HOST=$(echo ${VITE_SUPABASE_URL:-https://cwscaerzmixftirytvwo.supabase.co} | sed "s/https:\/\///")' >> /docker-entrypoint.sh && \
    echo '# Load environment variables from .env file if it exists' >> /docker-entrypoint.sh && \
    echo 'if [ -f "/.env" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Loading environment variables from /.env"' >> /docker-entrypoint.sh && \
    echo '  export $(grep -v "^#" /.env | xargs)' >> /docker-entrypoint.sh && \
    echo 'elif [ -f "/.env.production" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Loading environment variables from /.env.production"' >> /docker-entrypoint.sh && \
    echo '  export $(grep -v "^#" /.env.production | xargs)' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '# Update SUPABASE_HOST from VITE_SUPABASE_URL if it exists' >> /docker-entrypoint.sh && \
    echo 'if [ ! -z "$VITE_SUPABASE_URL" ]; then' >> /docker-entrypoint.sh && \
    echo '  export SUPABASE_HOST=$(echo $VITE_SUPABASE_URL | sed "s/https:\/\///")' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '# Process Nginx configuration templates' >> /docker-entrypoint.sh && \
    echo 'envsubst "$(env | awk -F = \'{print "$" $1}\')" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo '/docker-entrypoint.d/init-certs.sh' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose ports for HTTP and HTTPS
EXPOSE 80 443

# Start Nginx with the entrypoint script
CMD ["/docker-entrypoint.sh"]