#!/bin/bash


# Build the Docker image with build arguments
docker build \
  --secret id=VITE_SUPABASE_URL,src=/Users/irec/.docker/run/secrets/VITE_SUPABASE_URL \
  --secret id=VITE_SUPABASE_ANON_KEY,src=/Users/irec/.docker/run/secrets/VITE_SUPABASE_ANON_KEY \
  --secret id=VITE_STRIPE_PUBLISHABLE_KEY,src=/Users/irec/.docker/run/secrets/VITE_STRIPE_PUBLISHABLE_KEY \
  --secret id=VITE_STRIPE_PREMIUM_PRICE_ID,src=/Users/irec/.docker/run/secrets/VITE_STRIPE_PREMIUM_PRICE_ID \
  --secret id=VITE_BASIC_ENCRYPTION_KEY,src=/Users/irec/.docker/run/secrets/VITE_BASIC_ENCRYPTION_KEY \
  --secret id=VITE_PREMIUM_ENCRYPTION_KEY,src=/Users/irec/.docker/run/secrets/VITE_PREMIUM_ENCRYPTION_KEY \
  --secret id=VITE_WEBHOOK_SECRET,src=/Users/irec/.docker/run/secrets/VITE_WEBHOOK_SECRET \
  --secret id=VITE_OPENROUTER_API_KEY,src=/Users/irec/.docker/run/secrets/VITE_OPENROUTER_API_KEY \
  -t ghcr.io/ireccode/sap-exam-prep:latest .

# Deploy the stack
docker stack deploy -c docker-stack.yaml sap-exam 