#!/bin/bash

# Run AutoShare Indexer with proper environment variables
echo "🚀 Starting AutoShare Indexer..."

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "⚠️  No .env file found, using default values"
fi

# Set default values if not provided
export POSTGRES_CONNECTION_STRING=${POSTGRES_CONNECTION_STRING:-"postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer"}

# Check if DNA_TOKEN is set
if [ -z "$DNA_TOKEN" ] || [ "$DNA_TOKEN" = "your_dna_api_key_here" ]; then
    echo "❌ DNA_TOKEN not set. Please update your .env file with your Apibara API key."
    echo "   Get your API key from: https://app.apibara.com/"
    exit 1
fi

echo "📊 Database: $POSTGRES_CONNECTION_STRING"
echo "🔑 DNA Token: ${DNA_TOKEN:0:10}..."
echo "📡 Contract: $AUTOSHARE_CONTRACT_ADDRESS"

# Start the indexer
echo "🚀 Starting indexer in development mode..."
pnpm run dev 