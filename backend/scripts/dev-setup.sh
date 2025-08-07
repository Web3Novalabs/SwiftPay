#!/bin/bash

# SwiftPay Backend Development Setup Script

echo "🚀 Setting up SwiftPay Backend development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. You can use Docker instead:"
    echo "   docker-compose up -d postgres"
    echo "   Or install PostgreSQL manually."
else
    echo "✅ PostgreSQL found"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Create database if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo "🗄️  Creating database..."
    createdb swiftpay_db 2>/dev/null || echo "Database already exists or PostgreSQL not running"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start PostgreSQL (or use Docker: docker-compose up -d postgres)"
echo "3. Run: npm run dev"
echo ""
echo "Available commands:"
echo "  npm run dev     - Start development server"
echo "  npm run build   - Build for production"
echo "  npm run test    - Run tests"
echo "  npm run lint    - Run linting"
echo "" 