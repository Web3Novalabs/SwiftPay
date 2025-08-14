# AutoShare Indexer - Quick Start Guide

Get your AutoShare contract indexer running in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Prerequisites
- Node.js 18+ and pnpm
- Docker and Docker Compose
- Apibara DNA API key

### 2. One-Command Setup
```bash
# Clone and navigate to the project
cd indexerx

# Run the automated setup script
./scripts/setup.sh
```

### 3. Configure Your Contract
Edit `apibara.config.ts` and replace the placeholder contract address:
```typescript
contractAddress: "0x1234567890abcdef...", // Your actual contract address
```

### 4. Start Everything
```bash
# Terminal 1: Start the indexer
pnpm run dev

# Terminal 2: Start the API server
pnpm run api:dev
```

## 🌐 What You Get

- **Real-time indexing** of all AutoShare contract events
- **PostgreSQL database** with comprehensive schema
- **REST API** for querying indexed data
- **pgAdmin** for database management (http://localhost:8080)
- **Multi-network support** (Sepolia, Mainnet, Testnet)

## 📊 Available Data

The indexer tracks:
- Group creation and management
- Member additions and updates
- Payment distributions
- Update requests and approvals
- All contract events with metadata

## 🔍 Sample Queries

```bash
# Get all groups
curl http://localhost:3001/api/groups

# Get group details
curl http://localhost:3001/api/groups/1

# Get recent events
curl http://localhost:3001/api/events

# Get analytics
curl http://localhost:3001/api/analytics/stats
```

## 🐛 Troubleshooting

### Common Issues
1. **Database connection failed**: Check if PostgreSQL container is running
2. **Contract not found**: Verify contract address in config
3. **API key error**: Set `DNA_TOKEN` in `.env` file

### Reset Everything
```bash
# Stop and remove containers
docker-compose down -v

# Restart setup
./scripts/setup.sh
```

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the [API endpoints](api/server.ts) for data access
- Customize the schema in [lib/schema.ts](lib/schema.ts)
- Add your own queries in [lib/queries.ts](lib/queries.ts)

## 🆘 Need Help?

- Check the logs: `pnpm run dev`
- Database issues: Check pgAdmin at http://localhost:8080
- API issues: Check server logs in the API terminal
- Open an issue on GitHub

---

**Happy Indexing! 🎉** 