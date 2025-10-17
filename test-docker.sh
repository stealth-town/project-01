#!/bin/bash

# Docker Build Test Script
# Tests the Docker build locally before deploying

set -e  # Exit on any error

echo "======================================"
echo "Docker Build Test Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Check if .env.local exists, if not copy from example
if [ ! -f "docker/.env.local" ]; then
    echo "Creating docker/.env.local from template..."
    cp docker/.env.example docker/.env.local
    echo ""
    echo "⚠️  Please edit docker/.env.local with your Supabase credentials"
    echo "   Then run this script again"
    exit 0
fi

# Use .env.local for testing
cp docker/.env.local docker/.env

echo "Step 1: Stop any running local services..."
echo ""

# Stop local Supabase if running
if command -v supabase &> /dev/null; then
    cd packages/database
    supabase stop 2>/dev/null || true
    cd ../..
fi

echo "✓ Local services stopped"
echo ""

echo "Step 2: Clean up old Docker containers and images..."
echo ""

cd docker

# Stop and remove existing containers
docker-compose down 2>/dev/null || true

# Remove old images (optional - comment out if you want to keep them)
# docker-compose down --rmi all 2>/dev/null || true

echo "✓ Cleanup complete"
echo ""

echo "Step 3: Build Docker images..."
echo "This may take 5-10 minutes on first run..."
echo ""

# Build images
docker-compose build --no-cache

echo ""
echo "✓ Docker images built successfully"
echo ""

echo "Step 4: Start services..."
echo ""

# Start services in detached mode
docker-compose up -d

echo ""
echo "✓ Services started"
echo ""

echo "Step 5: Wait for services to initialize..."
sleep 10

echo ""
echo "======================================"
echo "Service Status"
echo "======================================"
echo ""

docker-compose ps

echo ""
echo "======================================"
echo "Testing API Health Check"
echo "======================================"
echo ""

# Test health endpoint
sleep 5  # Give server a bit more time
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo ""
    echo "✓ API Server is responding!"
else
    echo ""
    echo "⚠️  API Server is not responding yet"
    echo "   This might be normal if it's still starting up"
    echo "   Check logs with: cd docker && docker-compose logs -f server"
fi

echo ""
echo "======================================"
echo "Test Complete!"
echo "======================================"
echo ""
echo "Services are running. Here's what you can do:"
echo ""
echo "View logs:"
echo "  cd docker && docker-compose logs -f"
echo ""
echo "View specific service logs:"
echo "  cd docker && docker-compose logs -f server"
echo "  cd docker && docker-compose logs -f trade-engine"
echo "  cd docker && docker-compose logs -f dungeon-runtime"
echo ""
echo "Test API:"
echo "  curl http://localhost:3000/health"
echo ""
echo "Stop services:"
echo "  cd docker && docker-compose down"
echo ""
echo "If everything looks good, you're ready to deploy!"
echo ""
