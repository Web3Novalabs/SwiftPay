#!/bin/bash

# Script to temporarily increase Docker memory for builds
# This is useful when building large Node.js applications

echo "🐳 Docker Memory Management Script"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📊 Current Docker system info:"
docker system df

echo ""
echo "🧹 Cleaning up Docker resources to free memory..."
docker system prune -f
docker volume prune -f

echo ""
echo "💡 Tips to resolve memory issues:"
echo "1. Try building with: ./deploy.sh build-memory"
echo "2. Increase Docker Desktop memory limit (if using Docker Desktop)"
echo "3. Use a machine with more RAM"
echo "4. Build on a larger DigitalOcean droplet"

echo ""
echo "🔄 Ready to try building again. Run:"
echo "   ./deploy.sh build"
echo "   or"
echo "   ./deploy.sh build-memory"
