# AutoShare Indexer

A comprehensive Apibara indexer for the AutoShare Starknet contract with PostgreSQL storage and REST API.

## 🚀 Features

- **Real-time Indexing**: Streams and processes Starknet blockchain events
- **PostgreSQL Storage**: Persistent storage with optimized schema
- **REST API**: Query indexed data for analytics and applications
- **Event Processing**: Handles GroupCreated, GroupPaid, and other contract events
- **Docker Support**: Easy local development setup
- **TypeScript**: Full type safety with Drizzle ORM

## 📊 Indexed Events

The indexer captures the following events from the AutoShare contract:

- **GroupCreated**: New group creation with metadata
- **GroupPaid**: Group payment events
- **GroupUpdateRequested**: Group update requests
- **GroupUpdateApproved**: Update approvals
- **GroupUpdated**: Completed group updates

## 🗄️ Database Schema

### Core Tables

- **groups**: Group information and status
- **group_members**: Group membership and percentages
- **group_addresses**: Child contract address mappings
- **events**: All contract events with metadata
- **group_payments**: Payment history and details
- **update_requests**: Group update requests and approvals
- **cursor_table**: Apibara state management

### Key Fields

- `group_id`: Unique identifier for each group
- `creator`: Contract address of group creator
- `status`: Group status (active, paid, updating)
- `event_type`: Type of blockchain event
- `block_number`: Starknet block number
- `transaction_hash`: Transaction identifier

## 🛠️ Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Apibara DNA API key ([Get one here](https://app.apibara.com/))

## 📦 Installation

1. **Clone and setup**:
```bash
cd indexerx
pnpm install
```

2. **Environment configuration**:
```bash
cp env.example .env
# Edit .env with your DNA_TOKEN and other settings
```

3. **Start PostgreSQL**:
```bash
docker compose up -d postgres
```

4. **Setup database**:
```bash
POSTGRES_CONNECTION_STRING="postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer" pnpm run setup:db
```

5. **Generate and apply migrations**:
```bash
pnpm drizzle:generate
pnpm drizzle:migrate
```

## 🚀 Usage

### Start the Indexer

```bash
# Development mode
./run-indexer.sh

# Or manually
pnpm run dev
```

### Start the API Server

```bash
# In a new terminal
POSTGRES_CONNECTION_STRING="postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer" npx tsx api/server.ts
```

The API server runs on port 3002 by default.

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server status

### Groups
- `GET /api/groups` - List all groups
- `GET /api/groups/:id` - Get group details
- `GET /api/groups/:id/members` - Get group members

### Events
- `GET /api/events` - List recent events
- `GET /api/events/:type` - Events by type

### Payments
- `GET /api/payments` - Payment history
- `GET /api/payments/group/:groupId` - Group payments

### Analytics
- `GET /api/analytics/stats` - Group and payment statistics
- `GET /api/analytics/timeline` - Activity timeline

### Search
- `GET /api/search?q=query` - Search groups and addresses

## 🐳 Docker Setup

### PostgreSQL Database

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: autoshare_indexer
      POSTGRES_USER: autoshare
      POSTGRES_PASSWORD: autoshare123
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
```

### Quick Start with Docker

```bash
# Start database
docker compose up -d postgres

# Wait for database to be ready, then setup
pnpm run setup:db
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
DNA_TOKEN=your_dna_api_key_here

# Database
POSTGRES_CONNECTION_STRING=postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer

# Contract
AUTOSHARE_CONTRACT_ADDRESS=0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d

# Optional
STARTING_BLOCK=0
NETWORK=sepolia
```

### Apibara Configuration

The indexer is configured in `apibara.config.ts` with:
- Contract address filtering
- Network presets (sepolia, mainnet, testnet)
- Runtime configuration

## 📈 Monitoring

### Indexer Status

Check the indexer logs for:
- Block processing status
- Event identification
- Database operations
- Error handling

### Database Queries

Monitor indexed data:
```sql
-- Check total events
SELECT COUNT(*) FROM events;

-- Check event types
SELECT event_type, COUNT(*) FROM events GROUP BY event_type;

-- Check groups
SELECT COUNT(*) FROM groups;
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `docker-compose.yml` and `api/server.ts`
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **Event parsing**: Check logs for Fel252 parsing issues
4. **Migration errors**: Run `pnpm drizzle:migrate` after schema changes

### Debug Commands

```bash
# Check database connection
psql "postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer" -c "SELECT 1;"

# View recent events
psql "postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer" -c "SELECT event_type, COUNT(*) FROM events GROUP BY event_type;"

# Check API server
curl http://localhost:3002/health
```

## 🏗️ Development

### Project Structure

```
indexerx/
├── indexers/           # Apibara indexer logic
├── lib/               # Database schema and queries
├── api/               # Express.js REST API
├── scripts/           # Setup and utility scripts
├── drizzle/           # Database migrations
└── docker-compose.yml # Local development setup
```

### Key Files

- `indexers/my-indexer.indexer.ts` - Main indexer logic
- `lib/schema.ts` - Database schema definition
- `lib/queries.ts` - Database query helpers
- `api/server.ts` - REST API server
- `scripts/setup-db.ts` - Database initialization

### Adding New Events

1. Update the event parsing logic in `processEvent()`
2. Add new event handlers
3. Update database schema if needed
4. Test with contract events

## 📚 API Examples

### Get All Groups
```bash
curl "http://localhost:3002/api/groups"
```
**Response**: Returns all indexed groups with metadata

### Get Recent Events
```bash
curl "http://localhost:3002/api/events?limit=10"
```
**Response**: Returns recent contract events (GroupCreated, UnknownEvent, etc.)

### Get Events by Group
```bash
curl "http://localhost:3002/api/events?group_id=72"
```
**Response**: Returns events for a specific group

### Get Group Details
```bash
curl "http://localhost:3002/api/groups/72"
```
**Response**: Returns detailed information for group ID 72

### Get Group Members
```bash
curl "http://localhost:3002/api/groups/72/members"
```
**Response**: Returns member list for a specific group

### Search Groups
```bash
curl "http://localhost:3002/api/search?q=HACKATHON&type=groups"
```
**Response**: Returns groups matching the search query

### Get Payment History
```bash
curl "http://localhost:3002/api/payments"
```
**Response**: Returns all group payment records

### Get Analytics
```bash
curl "http://localhost:3002/api/analytics/stats"
```
**Response**: Returns group and payment statistics

### Health Check
```bash
curl "http://localhost:3002/health"
```
**Response**: Returns server status and timestamp

## 🧪 API Testing

### Quick Test Commands

Test all endpoints with these working cURL commands:

```bash
# Test server health
curl "http://localhost:3002/health"

# Test groups endpoint (should return 1 group)
curl "http://localhost:3002/api/groups"

# Test events endpoint (should return 75+ events)
curl "http://localhost:3002/api/events?limit=3"

# Test specific group events
curl "http://localhost:3002/api/events?group_id=72"

# Test search functionality
curl "http://localhost:3002/api/search?q=HACKATHON"
```

### Expected Responses

- **Health Check**: `{"status":"healthy","timestamp":"..."}`
- **Groups**: `{"success":true,"data":[{"group_id":72,"name":"...","status":"active"}]}`
- **Events**: `{"success":true,"data":[{"event_type":"GroupCreated","group_id":72,...}]}`

### Testing Status

✅ **Working Endpoints**:
- Health check
- Groups listing
- Events listing
- Group-specific events

⚠️ **Endpoints Needing Data**:
- Payments (no payment events yet)
- Analytics (limited data)
- Update requests (no updates yet)
- Group members (no member events yet)

## 🔄 Updates and Maintenance

### Schema Changes

1. Modify `lib/schema.ts`
2. Generate migration: `pnpm drizzle:generate`
3. Apply migration: `pnpm drizzle:migrate`

### Indexer Updates

1. Modify indexer logic
2. Rebuild: `pnpm run build`
3. Restart indexer

### API Updates

1. Modify `api/server.ts`
2. Restart API server

## 📄 License

This project is part of the AutoShare ecosystem.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review logs for error details
- Verify configuration settings
- Check database connectivity

---

**Status**: ✅ Production Ready  
**Last Updated**: December 2024  
**Version**: 1.0.0 