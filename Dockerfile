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

# Vite app production stage
FROM node:20-alpine as app

WORKDIR /app

# Copy built files and necessary configs
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json

# Create entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo 'if [ -f /app/.env ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Loading environment from /app/.env"' >> /app/entrypoint.sh && \
    echo '  export $(grep -v "^#" /app/.env | xargs)' >> /app/entrypoint.sh && \
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

# Copy dist files from build stage and set proper permissions
RUN --mount=type=bind,from=build,source=/app/dist,target=/tmp/dist \
    cp -r /tmp/dist/* /usr/share/nginx/html/ && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create entrypoint script for Nginx
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '/docker-entrypoint.d/init-certs.sh' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80 443
CMD ["/docker-entrypoint.sh"]