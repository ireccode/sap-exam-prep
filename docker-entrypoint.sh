#!/bin/sh
set -e

# Set default values for environment variables
export VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-https://cwscaerzmixftirytvwo.supabase.co}
export SUPABASE_HOST=$(echo ${VITE_SUPABASE_URL:-https://cwscaerzmixftirytvwo.supabase.co} | sed "s/https:\/\///")
export VITE_TARGET_DOMAIN=${VITE_TARGET_DOMAIN:-examprep.techtreasuretrove.in}

# Load environment variables from .env file if it exists
if [ -f "/.env" ]; then
  echo "Loading environment variables from /.env"
  export $(grep -v "^#" /.env | xargs)
elif [ -f "/.env.production" ]; then
  echo "Loading environment variables from /.env.production"
  export $(grep -v "^#" /.env.production | xargs)
fi

# Update SUPABASE_HOST from VITE_SUPABASE_URL if it exists
if [ ! -z "$VITE_SUPABASE_URL" ]; then
  export SUPABASE_HOST=$(echo $VITE_SUPABASE_URL | sed "s/https:\/\///")
fi

# Process Nginx configuration templates
envsubst "$(env | awk -F = '{print "$" $1}')" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Initialize certificates
/docker-entrypoint.d/init-certs.sh

# Start Nginx
nginx -g "daemon off;" 