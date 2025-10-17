#!/bin/bash

echo "Renewing Let's Encrypt SSL certificates..."

# Renew certificates
docker compose run --rm certbot renew

# Reload nginx to use renewed certificates
docker compose restart nginx

echo "SSL certificate renewal complete!"
