#!/bin/sh

# Check if certificates exist by following symlinks
CERT_DIR="/etc/letsencrypt/live/${NGINX_HOST}"
if [ -L "$CERT_DIR/privkey.pem" ] && [ -L "$CERT_DIR/fullchain.pem" ]; then
    PRIV_KEY=$(readlink -f "$CERT_DIR/privkey.pem")
    FULL_CHAIN=$(readlink -f "$CERT_DIR/fullchain.pem")
    if [ -f "$PRIV_KEY" ] && [ -f "$FULL_CHAIN" ]; then
        echo "Certificates exist for ${NGINX_HOST}"
        exit 0
    fi
fi

#echo "Certificates missing for ${NGINX_HOST}, generating with certbot..."
#certbot --nginx -d ${NGINX_HOST} --email ${NGINX_CERT_EMAIL} --agree-tos --non-interactive

#echo "Certificate initialization complete" 