# Use Node.js 18 slim image
FROM node:18-alpine AS build

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

# Build project
RUN pnpm run build


# ---- Production ----
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy only necessary files
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/apibara.config.ts ./

# Expose port if needed (optional)
EXPOSE 8080

# Start indexer
CMD ["pnpm", "start", "--indexer", "paymesh-starknet"]
