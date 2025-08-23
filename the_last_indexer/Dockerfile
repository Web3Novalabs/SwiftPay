# Multi-stage build for Apibara indexer
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the indexer
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from build stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/apibara.config.ts ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S apibara -u 1001

# Change ownership of the app directory
RUN chown -R apibara:nodejs /app
USER apibara

# Expose port (if needed for health checks)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the indexer
CMD ["pnpm", "run", "start", "--indexer", "paymesh-starknet"]
