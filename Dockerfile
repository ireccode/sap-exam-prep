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
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.d/init-certs.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built files from build stage to Nginx HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

# Set proper permissions for Nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose ports for HTTP and HTTPS
EXPOSE 80 443

# Start Nginx with the entrypoint script
CMD ["/docker-entrypoint.sh"]