# Build stage
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
# build time with envs
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} 
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} 
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY} 
ENV VITE_STRIPE_PREMIUM_PRICE_ID=${VITE_STRIPE_PREMIUM_PRICE_ID} 
ENV VITE_BASIC_ENCRYPTION_KEY=${VITE_BASIC_ENCRYPTION_KEY} 
ENV VITE_PREMIUM_ENCRYPTION_KEY=${VITE_PREMIUM_ENCRYPTION_KEY} 
ENV VITE_WEBHOOK_SECRET=${VITE_WEBHOOK_SECRET} 
ENV VITE_OPENROUTER_API_KEY=${VITE_OPENROUTER_API_KEY}

WORKDIR /app    
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install


# Copy source code and build
COPY . .
RUN npm run build

# Debug: Show copied files after build
RUN echo "Public files after build:" && \
    find dist -type f -name "*.encrypted" -o -name "*.template" -o -name "*.jpg" -o -name "*.png" -o -name "*.json"  -o -name "*.js"  -o -name "*.css"

# Create directory for secrets
RUN mkdir -p /run/secrets
    
# Production stage
FROM nginx:alpine

WORKDIR /app

# Copy only the built files from build stage
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY examprep_app_nginx.conf /etc/nginx/conf.d/default.conf
 
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