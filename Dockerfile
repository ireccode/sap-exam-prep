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

# Copy source code and public files
COPY . .

# Build the application
RUN npm run build

# Debug: List contents of dist directory
RUN echo "Contents of dist:" && \
    ls -la dist/ && \
    echo "Contents of dist/static (if exists):" && \
    ls -la dist/static/ || echo "static directory not found"

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Debug: List contents after copy
RUN echo "Contents of /usr/share/nginx/html:" && \
    ls -la /usr/share/nginx/html/ && \
    echo "Contents of /usr/share/nginx/html/static (if exists):" && \
    ls -la /usr/share/nginx/html/static/ || echo "static directory not found"

# Ensure static directory exists
RUN mkdir -p /usr/share/nginx/html/static

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