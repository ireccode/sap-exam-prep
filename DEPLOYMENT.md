# Deployment Guide

This guide explains how to deploy the SAPArchitectPrep application using Docker and Docker Swarm.

## Prerequisites

- Docker and Docker Compose installed
- Docker Swarm initialized (for production deployment)
- Domain name configured (for production deployment)
- SSL certificates (for production deployment)

## Environment Configuration

The application uses environment variables for configuration. These are loaded from a `.env.production` file in the Docker container.

### Creating the .env.production File

1. Copy the template file:
   ```bash
   cp .env.production.template .env.production
   ```

2. Edit the `.env.production` file and fill in your actual values:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-supabase-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   VITE_STRIPE_PREMIUM_PRICE_ID=price_your_stripe_premium_price_id

   # Encryption Keys
   VITE_BASIC_ENCRYPTION_KEY=your_basic_encryption_key_min_32_chars
   VITE_PREMIUM_ENCRYPTION_KEY=your_premium_encryption_key_min_32_chars

   # Webhook Configuration
   VITE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # OpenRouter API Configuration
   VITE_OPENROUTER_API_KEY=sk-or-your-openrouter-api-key
   ```

## Development Deployment

For local development and testing:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

This will:
1. Build the Docker images
2. Mount the `.env.production` file into the container
3. Start the application on port 5173
4. Start Nginx on ports 80 and 443

## Production Deployment

For production deployment using Docker Swarm:

1. Initialize Docker Swarm if not already done:
   ```bash
   docker swarm init
   ```

2. Deploy the stack:
   ```bash
   docker stack deploy -c docker-stack.yaml sap-exam-prep
   ```

3. Verify the deployment:
   ```bash
   docker stack ps sap-exam-prep
   ```

## SSL Certificates

The application uses Let's Encrypt for SSL certificates. The certificates are automatically generated and renewed by the Nginx container.

### Manual Certificate Generation

If you need to generate certificates manually:

```bash
# SSH into the Nginx container
docker exec -it $(docker ps -q -f name=nginx) /bin/sh

# Generate certificates
certbot --nginx -d your-domain.com -m your-email@example.com --agree-tos --non-interactive
```

## Updating the Application

To update the application:

1. Pull the latest image:
   ```bash
   docker pull ghcr.io/ireccode/sap-exam-prep:latest
   ```

2. Update the stack:
   ```bash
   docker stack deploy -c docker-stack.yaml sap-exam-prep
   ```

## Troubleshooting

### Environment Variables Not Loading

If environment variables are not loading correctly:

1. Check that the `.env.production` file exists and is mounted correctly:
   ```bash
   docker exec -it $(docker ps -q -f name=app) /bin/sh -c "ls -la /app/.env"
   ```

2. Verify the contents of the `.env` file in the container:
   ```bash
   docker exec -it $(docker ps -q -f name=app) /bin/sh -c "cat /app/.env"
   ```

### Nginx Configuration Issues

If you encounter issues with Nginx:

1. Check the Nginx configuration:
   ```bash
   docker exec -it $(docker ps -q -f name=nginx) /bin/sh -c "nginx -t"
   ```

2. Check the Nginx logs:
   ```bash
   docker logs $(docker ps -q -f name=nginx)
   ```

## Backup and Restore

### Backing Up Environment Variables

It's important to keep a backup of your environment variables:

```bash
# Create a backup
cp .env.production .env.production.backup
```

### Backing Up SSL Certificates

To backup SSL certificates:

```bash
# Create a backup directory
mkdir -p ssl-backup

# Copy certificates
cp -r /etc/letsencrypt ssl-backup/
```

## Security Considerations

- Keep your `.env.production` file secure and never commit it to version control
- Regularly rotate encryption keys and API keys
- Use strong, unique passwords for all services
- Implement proper firewall rules to restrict access to your servers
- Regularly update all components (Docker, Nginx, etc.) 