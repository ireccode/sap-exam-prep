#!/bin/bash

# Supabase project DB PAssword needed for login and for the Edge Functions:
# supabase login
# supabase link --project-ref cwscaerzmixftirytvwo

# Set encryption keys as Supabase secrets
echo "Setting encryption keys as Supabase secrets..."
supabase secrets set PREMIUM_ENCRYPTION_KEY=$PREMIUM_ENCRYPTION_KEY
supabase secrets set BASIC_ENCRYPTION_KEY=$BASIC_ENCRYPTION_KEY
supabase secrets set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
supabase secrets set WEBHOOK_SECRET=$WEBHOOK_SECRET
supabase secrets set CLIENT_URL=$CLIENT_URL
supabase secrets set OPENROUTER_API_KEY=$OPENROUTER_API_KEY

# Deploy the decrypt-content function
echo "Deploying decrypt-content Edge Function..."
supabase functions deploy decrypt-content
supabase functions deploy create-checkout-session  --no-verify-jwt
supabase functions deploy webhook-handler  --no-verify-jwt
supabase functions deploy create-portal-session --no-verify-jwt 
supabase functions deploy chat --no-verify-jwt 


echo "Edge Function deployment complete!" 