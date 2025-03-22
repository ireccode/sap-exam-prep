# TODO z roadmap klik in egz and forward premium_price_id to VITE_STRIPE_PREMIUM_PRICE_ID as aactual product to check subsc
OPENROUTER_API_KEY=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
#ENCRYPTION_KEY=ba8cjmtIGcRYXIMo1q2S

# Supabase Configuration
# Public keys (safe to expose in browser)
VITE_SUPABASE_URL=https://cwscaerzmixftirytvwo.supabase.co
VITE_POSTGRES_URL="postgresql://postgres:UdZ4zDjwn32#MdVJ@db.cwscaerzmixftirytvwo.supabase.co:5432/postgres"
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2NhZXJ6bWl4ZnRpcnl0dndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzExMzcsImV4cCI6MjA0OTY0NzEzN30.HrDx1gFj1hvaGRiy3wjJ_LyTEIOU1I-0DeX6pyHclg8
# Service Role Key (server-side only, NEVER expose to browser)
# To find this key:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to Project Settings > API
# 4. Copy the "service_role" key
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2NhZXJ6bWl4ZnRpcnl0dndvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDA3MTEzNywiZXhwIjoyMDQ5NjQ3MTM3fQ.PvYxRVqOXc1Qzskjn1ZT0YDj-KYlkiHBj-MXgoIOg7k

# TODO check if user profile is_premium and if so, descrypt the premium_btp_query_bank.json file with below encryption key
PREMIUM_ENCRYPTION_KEY=ba8cjmtIGc34XIMo1q2S

BASIC_ENCRYPTION_KEY=YETsRL3gnn5K1uFy5yxTHb

# Stripe Configuration
#old VITE_SECRET_KEY=sk_test_51QVTpPLqVp8miPvf8TkqWUf0In7j1LPAMwYYBD2cPRB9Ydil7jkTcYD6YU3TWjUrG94KSvwkQBOBGIWqGGnrRKdJ00fRVEA1fK
STRIPE_SECRET_KEY=sk_test_51QVTpPLqVp8miPvfFJXASZXlutydz1ZGC5jTmCceylKg0IUV0uYliL0ERgQvJQzKmigMmoWaCZwiSC5MU0rSPZA300DqiM0IzH
# To get the webhook secret:
# 1. Go to Stripe Dashboard > Developers > Webhooks
# 2. Click on your webhook endpoint
# 3. Click "Reveal" next to "Signing secret"
# 4. Copy that value here
# old WEBHOOK_SECRET=whsec_Hf9ZZMYGq8npvyNlKFJMgzBY4VSQnFtX
WEBHOOK_SECRET=whsec_dfwNYEM9frieN2BlQCp7CObKNYT1AAmu
# in console: > Ready! You are using Stripe API Version [2024-11-20.acacia]. Your webhook signing secret is whsec_8697dfe367dc5d6b751331f94ce5535ee254bb34bbb1dca0731a3f04f55fef3e (^C to quit)


# old VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51QVTpPLqVp8miPvf3EljoUiOw4oMqY5AGTqAT9VXewW9WNvyCH4sxspoz9BTXeKrAASGdRSzcyKxmMp2sSpJJpyQ00CwO4SuUb
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51QVTpPLqVp8miPvfUtUBMIyhyIb2js4U8rtSP0ldhJW5NEc4CRI3ePAfA8nm151eQowPT1SrHE1dosDCxQ8UQW6N00SRSJp4wp
# premoum 19
# After change the price id, Rebuild the application to pick up the new environment variable value
# Redeploy the Edge Function to use the new value
# Let's do this:
# Stop curernt server:  pkill -f "vite" 
# npm run build && supabase functions deploy create-checkout-session --no-verify-jwt

#premium 29
VITE_STRIPE_PREMIUM_PRICE_ID=price_1QvvHdLqVp8miPvf3WtEKf0F

# auto key rotation default false
VITE_ENABLE_AUTO_ROTATION=false

## in Stripe Set up the webhook endpoint to point to your Supabase Edge Function URL:
##  https://cwscaerzmixftirytvwo.supabase.co/functions/v1/webhook-handler

## Supabase project DB PAssword needed for login and for the Edge Functions:
#  supabase login
#  supabase link --project-ref cwscaerzmixftirytvwo
#  supabase functions deploy create-checkout-session  --no-verify-jwt
#  supabase functions deploy webhook-handler  --no-verify-jwt
# supabase functions deploy create-portal-session --no-verify-jwt 
# supabase functions deploy chat --no-verify-jwt 


# export SUPABASE_ACCESS_TOKEN=sbp_df2943b606ac7d2cb920a3bf55cbbfddf2ef5f51

# supabase secrets set STRIPE_SECRET_KEY=sk_test_51QVTpPLqVp8miPvfFJXASZXlutydz1ZGC5jTmCceylKg0IUV0uYliL0ERgQvJQzKmigMmoWaCZwiSC5MU0rSPZA300DqiM0IzH
# supabase secrets set WEBHOOK_SECRET=whsec_dfwNYEM9frieN2BlQCp7CObKNYT1AAmu
# supabase secrets set OPENROUTER_API_KEY=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
# supabase secrets set CLIENT_URL=http://localhost:5173

supabase secrets set VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51QVTpPLqVp8miPvfUtUBMIyhyIb2js4U8rtSP0ldhJW5NEc4CRI3ePAfA8nm151eQowPT1SrHE1dosDCxQ8UQW6N00SRSJp4wp




# IF production url https://sap-architect-exam-prep.netlify.app
# supabase secrets set CLIENT_URL=https://sap-architect-exam-prep.netlify.app

#docker encrypt secrets
#printf 'YETsRL3gnn5K1uFy5yxTHb' | docker secret create VITE_BASIC_ENCRYPTION_KEY -
#root@srv708639:~/sap-exam-prep_v0# docker secret ls
#ID                          NAME                           DRIVER    CREATED              UPDATED
#ir3rnoktqhim1yrvdw4oiewa2   VITE_BASIC_ENCRYPTION_KEY                38 seconds ago       38 seconds ago

# curl -L -X POST 'https://cwscaerzmixftirytvwo.supabase.co/functions/v1/create-portal-session' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2NhZXJ6bWl4ZnRpcnl0dndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzExMzcsImV4cCI6MjA0OTY0NzEzN30.HrDx1gFj1hvaGRiy3wjJ_LyTEIOU1I-0DeX6pyHclg8' --data '{"name":"Functions"}'
# -- {"error":"Unauthorized"}

# curl -L -X POST 'https://cwscaerzmixftirytvwo.supabase.co/functions/v1/webhook-handler' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2NhZXJ6bWl4ZnRpcnl0dndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzExMzcsImV4cCI6MjA0OTY0NzEzN30.HrDx1gFj1hvaGRiy3wjJ_LyTEIOU1I-0DeX6pyHclg8' --data '{"name":"Functions"}'
# Response good - no errors

# stripe listen --forward-to https://cwscaerzmixftirytvwo.supabase.co/functions/v1/webhook-handler

# # Stop existing containers
# docker-compose down

# # Remove existing images
# docker rmi sap-exam-prep-app

# # Rebuild and start
# docker compose up --build

# # Check if environment variables are set in the container
# docker exec sap-exam-prep-app env | grep VITE

