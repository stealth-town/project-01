#!/bin/bash

# Quick stop and cleanup script

echo "Stopping all Docker services..."
docker-compose down

echo ""
echo "Services stopped!"
echo ""
echo "To see remaining containers: docker ps -a"
echo "To remove all stopped containers: docker container prune"
echo "To remove unused images: docker image prune -a"
