#!/bin/bash

echo "Setting up Let's Encrypt SSL certificates..."

# Create certbot directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Check if email is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <your-email@example.com>"
    echo "Please provide your email address for Let's Encrypt registration"
    exit 1
fi

EMAIL=$1

echo "Using email: $EMAIL"

# Update docker compose.yml with the provided email
sed -i.bak "s/your-email@example.com/$EMAIL/g" docker compose.yml

echo "Starting nginx without SSL first..."
# Use initial config for certificate request
cp nginx-init.conf nginx.conf
docker compose up -d nginx

echo "Waiting for nginx to start..."
sleep 10

echo "Requesting SSL certificate from Let's Encrypt..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d api.flagwars.dev

if [ $? -eq 0 ]; then
    echo "SSL certificate obtained successfully!"
    echo "Switching to SSL-enabled nginx configuration..."
    # Restore the full nginx config with SSL
    git checkout nginx.conf 2>/dev/null || echo "Using current nginx.conf with SSL"
    docker compose restart nginx
    
    echo "Testing HTTPS endpoint..."
    curl -I https://api.flagwars.dev/health
    
    echo ""
    echo "✅ HTTPS setup complete!"
    echo "Your API is now available at: https://api.flagwars.dev"
    echo "Health check: https://api.flagwars.dev/health"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Please check the logs and try again"
    exit 1
fi
