#!/bin/bash

# AutoShare Indexer Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up AutoShare Indexer..."

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo "❌ pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    echo "✅ All requirements met"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed"
}

# Setup environment
setup_environment() {
    echo "🔧 Setting up environment..."
    
    if [ ! -f .env ]; then
        echo "📝 Creating .env file..."
        cp env.example .env
        echo "⚠️  Please update .env file with your actual values:"
        echo "   - DNA_TOKEN: Your Apibara API key"
        echo "   - POSTGRES_CONNECTION_STRING: Database connection string"
        echo "   - AUTOSHARE_CONTRACT_ADDRESS: Your deployed contract address"
    else
        echo "✅ .env file already exists"
    fi
}

# Setup database
setup_database() {
    echo "🗄️  Setting up database..."
    
    # Start PostgreSQL container
    echo "🐳 Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    until docker-compose exec -T postgres pg_isready -U autoshare -d autoshare_indexer; do
        echo "⏳ Database not ready yet, waiting..."
        sleep 2
    done
    
    echo "✅ Database is ready"
    
    # Generate and apply migrations
    echo "🔄 Generating database migrations..."
    pnpm drizzle:generate
    
    echo "🔄 Applying database migrations..."
    pnpm drizzle:migrate
    
    # Setup database indexes and initial data
    echo "🔧 Setting up database indexes..."
    pnpm setup:db
    
    echo "✅ Database setup completed"
}

# Build indexer
build_indexer() {
    echo "🔨 Building indexer..."
    pnpm build
    echo "✅ Indexer built successfully"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env file with your actual values"
    echo "2. Update apibara.config.ts with your contract address"
    echo "3. Start the indexer: pnpm run dev"
    echo "4. Start the API server: pnpm run api:dev"
    echo ""
    echo "🌐 Available services:"
    echo "   - PostgreSQL: localhost:5432"
    echo "   - pgAdmin: http://localhost:8080 (admin@autoshare.com / admin123)"
    echo "   - API Server: http://localhost:3001"
    echo ""
    echo "📚 Documentation: README.md"
    echo ""
}

# Main setup flow
main() {
    check_requirements
    install_dependencies
    setup_environment
    setup_database
    build_indexer
    show_next_steps
}

# Run setup
main "$@" 