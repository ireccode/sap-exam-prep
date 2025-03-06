# Build stage
FROM node:20-alpine as build

# Add build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PREMIUM_PRICE_ID
ARG VITE_BASIC_ENCRYPTION_KEY
ARG VITE_PREMIUM_ENCRYPTION_KEY
ARG VITE_WEBHOOK_SECRET
ARG VITE_OPENROUTER_API_KEY

# Set environment variables for build time
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PREMIUM_PRICE_ID=$VITE_STRIPE_PREMIUM_PRICE_ID
ENV VITE_BASIC_ENCRYPTION_KEY=$VITE_BASIC_ENCRYPTION_KEY
ENV VITE_PREMIUM_ENCRYPTION_KEY=$VITE_PREMIUM_ENCRYPTION_KEY
ENV VITE_WEBHOOK_SECRET=$VITE_WEBHOOK_SECRET
ENV VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# First, explicitly copy the public directory
COPY public ./public/

# Verify public directory contents
RUN echo "Verifying public directory:" && \
    ls -la public/ && \
    echo "Public directory contents:" && \
    find public -type f

# Then copy the rest of the source code
COPY . .

# Create necessary directories
RUN mkdir -p dist/static

# Verify directory structure before build
RUN echo "Pre-build directory structure:" && \
    pwd && \
    ls -la && \
    echo "\nPublic directory:" && \
    ls -la public/ || echo "public/ not found" && \
    echo "\nVerifying public files:" && \
    find public -type f || echo "No files found in public/"

# Build the application
RUN npm run build

# Debug: List contents of dist directory and public directory
RUN echo "Post-build directory structure:" && \
    echo "Contents of public directory:" && \
    ls -la public/ && \
    echo "\nContents of dist:" && \
    ls -la dist/ && \
    echo "\nContents of dist/static (if exists):" && \
    ls -la dist/static/ || echo "static directory not found" && \
    echo "\nFull directory structure:" && \
    find dist -type f

# Production stage
FROM nginx:alpine

# Create necessary directories
RUN mkdir -p /usr/share/nginx/html/static

# Copy built assets from build stage
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Debug: List contents after copy
RUN echo "Contents of /usr/share/nginx/html:" && \
    ls -la /usr/share/nginx/html/ && \
    echo "\nContents of /usr/share/nginx/html/static (if exists):" && \
    ls -la /usr/share/nginx/html/static/ || echo "static directory not found" && \
    echo "\nFull nginx directory structure:" && \
    find /usr/share/nginx/html -type f

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install envsubst
RUN apk add --no-cache gettext

# Create a script to replace environment variables at runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80 5173

# Start nginx with environment variable substitution
ENTRYPOINT ["/docker-entrypoint.sh"] 