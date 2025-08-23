#!/bin/bash

# Deploy script for Paymesh Starknet Indexer
# Usage: ./deploy.sh [build|start|stop|restart|logs|status|clean]

set -euo pipefail

COMPOSE="docker-compose -f docker-compose.yml"
SERVICE="paymesh-indexer"

case "${1:-}" in
  build)
    echo "🔨 Building Docker image..."
    $COMPOSE build --no-cache
    ;;
  start)
    echo "🚀 Starting indexer..."
    $COMPOSE up -d
    ;;
  stop)
    echo "🛑 Stopping indexer..."
    $COMPOSE down
    ;;
  restart)
    echo "🔄 Restarting indexer..."
    $COMPOSE down
    $COMPOSE up -d
    ;;
  logs)
    echo "📋 Showing logs..."
    $COMPOSE logs -f $SERVICE
    ;;
  status)
    echo "📊 Container status:"
    $COMPOSE ps
    ;;
  clean)
    echo "🧹 Cleaning up unused Docker resources..."
    docker system prune -f
    docker volume prune -f
    ;;
  *)
    echo "Usage: $0 {build|start|stop|restart|logs|status|clean}"
    exit 1
    ;;
esac
