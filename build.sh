#!/bin/bash

# Build script for Unfuck Game
# This script builds all necessary packages for Docker deployment

set -e  # Exit on any error

echo "======================================"
echo "Unfuck Game - Build Script"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f "docker/.env" ]; then
    echo "ERROR: docker/.env file not found!"
    echo "Please run ./install.sh first"
    exit 1
fi

echo "Building packages in order..."
echo ""

# 1. Build shared package (required by all others)
echo "[1/3] Building shared package..."
cd packages/shared
yarn build
echo "✓ Shared package built"
echo ""

# 2. Build server
echo "[2/3] Building server..."
cd ../server
yarn build
echo "✓ Server built"
echo ""

# 3. Build workers
echo "[3/3] Building workers..."
cd ../workers/trade-engine
yarn build
echo "✓ Trade engine built"

cd ../dungeon-runtime
yarn build
echo "✓ Dungeon runtime built"
echo ""

# Return to root
cd ../../..

echo "======================================"
echo "Build Complete!"
echo "======================================"
echo ""
echo "All packages have been built successfully."
echo ""
echo "Next steps:"
echo "1. Make sure your Supabase Cloud database has the schema applied"
echo "   (Run docker/init-supabase.sql in your Supabase SQL editor)"
echo ""
echo "2. For the frontend (Netlify):"
echo "   - Push your code to GitHub"
echo "   - Connect your repo to Netlify"
echo "   - Set build command: cd packages/app && yarn build"
echo "   - Set publish directory: packages/app/dist"
echo "   - Add environment variable: VITE_API_URL=https://your-server-url/api"
echo ""
echo "3. Start backend services with Docker:"
echo "   cd docker && docker-compose up -d"
echo ""
echo "4. View logs:"
echo "   cd docker && docker-compose logs -f"
echo ""
