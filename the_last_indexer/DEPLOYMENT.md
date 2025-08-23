# Paymesh Starknet Indexer - Docker Deployment Guide

This guide explains how to deploy the Paymesh Starknet Indexer using Docker on DigitalOcean.

## Prerequisites

- Docker and Docker Compose installed on your DigitalOcean droplet
- Access to your DigitalOcean droplet via SSH

## Quick Start

1. **Clone your repository** to the DigitalOcean droplet:
   ```bash
   git clone <your-repo-url>
   cd the_last_indexer
   ```

2. **Build and start the indexer**:
   ```bash
   ./deploy.sh build
   ./deploy.sh start
   ```

3. **Check the status**:
   ```bash
   ./deploy.sh status
   ```

## Deployment Commands

The `deploy.sh` script provides easy management commands:

- `./deploy.sh build` - Build the Docker image
- `./deploy.sh start` - Start the indexer
- `./deploy.sh stop` - Stop the indexer
- `./deploy.sh restart` - Restart the indexer
- `./deploy.sh logs` - View logs
- `./deploy.sh status` - Check status and resource usage

## Manual Docker Commands

If you prefer to use Docker commands directly:

```bash
# Build the image
docker-compose build

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f paymesh-indexer

# Stop the service
docker-compose down
```

## Environment Variables

Edit the `docker-compose.yml` file to add your environment variables:

```yaml
environment:
  - NODE_ENV=production
  - API_URL=your_api_url_here
  - DATABASE_URL=your_database_url_here
```

## Monitoring

The container includes health checks and resource limits:

- **Health Check**: Runs every 30 seconds
- **Memory Limit**: 1GB maximum, 512MB reserved
- **CPU Limit**: 0.5 cores maximum, 0.25 cores reserved

## Logs

Logs are mounted to `./logs` directory for persistence. You can view them with:

```bash
./deploy.sh logs
```

## Troubleshooting

1. **Check container status**:
   ```bash
   docker-compose ps
   ```

2. **View container logs**:
   ```bash
   docker-compose logs paymesh-indexer
   ```

3. **Restart the service**:
   ```bash
   ./deploy.sh restart
   ```

4. **Rebuild from scratch**:
   ```bash
   ./deploy.sh stop
   ./deploy.sh build
   ./deploy.sh start
   ```

## DigitalOcean Specific Notes

- The resource limits are optimized for DigitalOcean's basic droplets
- Use `restart: unless-stopped` for automatic recovery
- Health checks help with load balancer integration if needed

## Security

- The container runs as a non-root user (`apibara`)
- Only production dependencies are included in the final image
- Multi-stage build reduces attack surface
