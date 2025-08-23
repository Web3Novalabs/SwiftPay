#!/bin/bash

# Deploy script for Paymesh Starknet Indexer
# Usage: ./deploy.sh [build|start|stop|restart|logs|status]

set -e

COMPOSE_FILE="docker-compose.yml"
SERVICE_NAME="paymesh-indexer"

case "$1" in
  build)
    echo "🔨 Building Docker image..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo "✅ Build completed!"
    ;;
  start)
    echo "🚀 Starting indexer..."
    docker-compose -f $COMPOSE_FILE up -d
    echo "✅ Indexer started!"
    ;;
  stop)
    echo "🛑 Stopping indexer..."
    docker-compose -f $COMPOSE_FILE down
    echo "✅ Indexer stopped!"
    ;;
  restart)
    echo "🔄 Restarting indexer..."
    docker-compose -f $COMPOSE_FILE restart
    echo "✅ Indexer restarted!"
    ;;
  logs)
    echo "📋 Showing logs..."
    docker-compose -f $COMPOSE_FILE logs -f $SERVICE_NAME
    ;;
  status)
    echo "📊 Container status:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    echo "📈 Resource usage:"
    docker stats --no-stream $SERVICE_NAME
    ;;
  *)
    echo "Usage: $0 {build|start|stop|restart|logs|status}"
    echo ""
    echo "Commands:"
    echo "  build   - Build the Docker image"
    echo "  start   - Start the indexer"
    echo "  stop    - Stop the indexer"
    echo "  restart - Restart the indexer"
    echo "  logs    - Show logs"
    echo "  status  - Show status and resource usage"
    exit 1
    ;;
esac
