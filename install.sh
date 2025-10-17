#!/bin/bash

# Installation script for Unfuck Game
# This script prepares the project for Docker deployment

set -e  # Exit on any error

echo "======================================"
echo "Unfuck Game - Installation Script"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker is installed"
echo "✓ Docker Compose is installed"
echo ""

# Check if .env file exists
if [ ! -f "docker/.env" ]; then
    echo "WARNING: docker/.env file not found!"
    echo "Creating .env file from template..."
    cp docker/.env.example docker/.env
    echo ""
    echo "⚠️  IMPORTANT: Please edit docker/.env and add your Supabase credentials"
    echo "   You can get these from your Supabase Cloud project:"
    echo "   1. Go to Project Settings > API"
    echo "   2. Copy the Project URL (SUPABASE_API_URL)"
    echo "   3. Copy the anon/public key (SUPABASE_ANON_KEY)"
    echo ""
    echo "After updating .env, run: ./build.sh"
    exit 0
fi

echo "✓ Environment file exists"
echo ""

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "Installing Yarn..."
    npm install -g yarn
fi

echo "✓ Yarn is installed"
echo ""

# Enable Corepack for Yarn 4
echo "Enabling Corepack for Yarn 4..."
corepack enable

echo "✓ Corepack enabled"
echo ""

# Install dependencies
echo "Installing dependencies..."
yarn install --immutable

echo "✓ Dependencies installed"
echo ""

echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Make sure you've updated docker/.env with your Supabase credentials"
echo "2. Run the build script: ./build.sh"
echo "3. Start the services: cd docker && docker-compose up -d"
echo ""
