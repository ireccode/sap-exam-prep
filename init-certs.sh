#!/bin/sh
set -e

# Check if certificates exist
if [ ! -d "/etc/letsencrypt/live/localhost" ]; then
    echo "Certificates not found. Generating self-signed certificates..."
    
    # Create directory for certificates
    mkdir -p /etc/letsencrypt/live/localhost
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/localhost/privkey.pem \
        -out /etc/letsencrypt/live/localhost/fullchain.pem \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    
    echo "Self-signed certificates generated successfully."
else
    echo "Certificates found. Using existing certificates."
fi

# Set proper permissions
chmod -R 755 /etc/letsencrypt/live/localhost
chmod 644 /etc/letsencrypt/live/localhost/fullchain.pem
chmod 600 /etc/letsencrypt/live/localhost/privkey.pem

echo "Certificate setup completed." 