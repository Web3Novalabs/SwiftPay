# Paymesh Starknet Indexer - Docker Deployment Guide

This guide explains how to deploy the Paymesh Starknet Indexer using Docker on DigitalOcean.

## Prerequisites

- Docker and Docker Compose installed on your DigitalOcean droplet
- Access to your DigitalOcean droplet via SSH
- **Minimum 2GB RAM recommended** for building the Docker image

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

- `./deploy.sh build` - Build the Docker image with pnpm
- `./deploy.sh build-memory` - Build with npm (better memory management)
- `./deploy.sh start` - Start the indexer
- `./deploy.sh stop` - Stop the indexer
- `./deploy.sh restart` - Restart the indexer
- `./deploy.sh logs` - View logs
- `./deploy.sh status` - Check status and resource usage
- `./deploy.sh clean` - Clean up Docker resources

## Resolving Memory Issues During Build

If you encounter error code 137 (out of memory) during the build:

### Option 1: Use Memory-Optimized Build
```bash
./deploy.sh build-memory
```
This uses npm instead of pnpm and is more memory-efficient.

### Option 2: Clean Up Docker Resources
```bash
./deploy.sh clean
./deploy.sh build
```

### Option 3: Increase System Memory
- Use a larger DigitalOcean droplet (4GB+ RAM recommended)
- Close other applications during build
- Ensure Docker has enough memory allocated

### Option 4: Build in Stages
```bash
# Clean first
./deploy.sh clean

# Try building again
./deploy.sh build
```

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
  - DNA_TOKEN="${DNA_TOKEN}"
  - API="${API}"
```

## Monitoring

The container includes health checks and resource limits:

- **Health Check**: Runs every 30 seconds
- **Memory Limit**: 2GB maximum, 1GB reserved
- **Build Memory**: Optimized with Node.js memory settings

## Logs

Logs are available through Docker Compose:

```bash
./deploy.sh logs
```

## Troubleshooting

### Memory Issues (Error 137)
1. **Use memory-optimized build**:
   ```bash
   ./deploy.sh build-memory
   ```

2. **Clean Docker resources**:
   ```bash
   ./deploy.sh clean
   ```

3. **Check system memory**:
   ```bash
   free -h
   docker system df
   ```

### Other Common Issues
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

- **Minimum droplet size**: 2GB RAM (4GB+ recommended for builds)
- The resource limits are optimized for DigitalOcean's basic droplets
- Use `restart: unless-stopped` for automatic recovery
- Health checks help with load balancer integration if needed

## Security

- The container runs as a non-root user (`apibara`)
- Only production dependencies are included in the final image
- Multi-stage build reduces attack surface

## Alternative Build Methods

If you continue to have memory issues:

1. **Build locally** and push the image to a registry
2. **Use GitHub Actions** to build and push the image
3. **Build on a larger machine** and transfer the image
4. **Use the alternative Dockerfile** with npm instead of pnpm
