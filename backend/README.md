# SwiftPay Backend

A TypeScript Express.js backend for SwiftPay, providing API services for the AutoShare smart contract integration on StarkNet.

## 🚀 Features

### Core Functionality
- **Group Management**: Create, update, and manage payment groups
- **Payment Processing**: Handle group payments and fund distribution
- **User Management**: User profiles, statistics, and activity tracking
- **Real-time Updates**: WebSocket support for live notifications
- **Blockchain Integration**: StarkNet contract interaction and event processing
- **Analytics & Metrics**: Comprehensive platform statistics and user analytics

### Smart Contract Integration
- **AutoShare Contract**: Full integration with the AutoShare smart contract
- **Event Indexing**: Blockchain event processing and database synchronization
- **Transaction Management**: Handle group creation, payments, and updates
- **Fee Collection**: Manage 1 STRK fees for group creation and updates

### Database Features
- **PostgreSQL**: Robust relational database with TypeORM
- **Event Storage**: Blockchain event indexing and processing
- **User Analytics**: Comprehensive user statistics and metrics
- **Payment Tracking**: Complete payment history and status tracking

## 🏗️ Architecture

```
src/
├── config/           # Database and WebSocket configuration
├── entities/         # TypeORM database entities
├── middleware/       # Express middleware (error handling, rate limiting)
├── routes/           # API route handlers
├── services/         # Business logic services
├── utils/            # Utility functions and logging
└── index.ts          # Main application entry point
```

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with TypeORM
- **Blockchain**: StarkNet integration
- **Real-time**: WebSocket support
- **Logging**: Winston logger
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## 📦 Installation & Setup

### Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   # Should be v18.x.x or higher
   ```

2. **PostgreSQL** (v14 or higher)
   ```bash
   # macOS with Homebrew
   brew install postgresql@14
   brew services start postgresql@14
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

3. **Git**
   ```bash
   git --version
   ```

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swiftpay-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env  # or use your preferred editor
   ```

4. **Database Setup**
   ```bash
   # Create database user
   createuser -s swiftpay
   
   # Create database
   createdb swiftpay_db
   
   # Set password for swiftpay user
   psql -d swiftpay_db -c "ALTER USER swiftpay PASSWORD 'password';"
   ```

5. **Initialize Database Tables**
   ```bash
   # Build the project
   npm run build
   
   # Start the server (this will create tables automatically)
   npm run dev
   ```

6. **Verify Installation**
   ```bash
   # Test health endpoint
   curl http://localhost:3000/health
   
   # Test API endpoints
   curl http://localhost:3000/api/v1/groups
   curl http://localhost:3000/api/v1/metrics/overview
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=swiftpay
DB_PASSWORD=password
DB_DATABASE=swiftpay_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# StarkNet Configuration
STARKNET_RPC_URL=https://alpha-mainnet.starknet.io
STARKNET_CHAIN_ID=SN_MAIN
AUTOSHARE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890123456789012345678901234
STRK_TOKEN_ADDRESS=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d

# Indexer Configuration
INDEXER_ENABLED=false
INDEXER_POLL_INTERVAL=10000

# WebSocket Configuration
WS_PORT=3001

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Important Configuration Notes

- **AUTOSHARE_CONTRACT_ADDRESS**: Set to your deployed contract address. For development, use the placeholder value.
- **DB_PASSWORD**: Change the default password in production
- **JWT_SECRET**: Use a strong, unique secret in production
- **NODE_ENV**: Set to `production` for production deployment

## 🚀 Running the Application

### Development Mode
```bash
# Start development server with hot reload
npm run dev

# The server will be available at:
# - API: http://localhost:3000
# - WebSocket: ws://localhost:3001
# - Health Check: http://localhost:3000/health
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name swiftpay-backend
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run linting
npm run test:watch  # Run tests in watch mode
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Most endpoints require StarkNet wallet authentication via private key in request body.

### Core Endpoints

#### Groups
```bash
# Get all groups
GET /api/v1/groups

# Get specific group
GET /api/v1/groups/:id

# Create new group
POST /api/v1/groups
{
  "name": "Group Name",
  "amount": "1000000000000000000",
  "members": [
    {"addr": "0x123...", "percentage": 50},
    {"addr": "0x456...", "percentage": 50}
  ],
  "tokenAddress": "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  "creatorAddress": "0x789...",
  "privateKey": "0xabc..."
}

# Pay group
POST /api/v1/groups/:id/pay
{
  "payerAddress": "0x123...",
  "privateKey": "0xabc..."
}

# Request group update
POST /api/v1/groups/:id/update-request
{
  "newName": "Updated Group Name",
  "newAmount": "2000000000000000000",
  "newMembers": [...],
  "requesterAddress": "0x123...",
  "privateKey": "0xabc..."
}
```

#### Users
```bash
# Get user profile (creates if doesn't exist)
GET /api/v1/users/0x1234567890123456789012345678901234567890123456789012345678901234

# Update user profile
PUT /api/v1/users/0x1234567890123456789012345678901234567890123456789012345678901234
{
  "username": "john_doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg"
}

# Get user's groups
GET /api/v1/users/0x1234567890123456789012345678901234567890123456789012345678901234/groups

# Get user's payments
GET /api/v1/users/0x1234567890123456789012345678901234567890123456789012345678901234/payments

# Get user statistics
GET /api/v1/users/0x1234567890123456789012345678901234567890123456789012345678901234/stats
```

#### Payments
```bash
# Get all payments
GET /api/v1/payments

# Get specific payment
GET /api/v1/payments/:id

# Get payment statistics
GET /api/v1/payments/stats/overview

# Get payments by group
GET /api/v1/payments/group/:groupId

# Update payment status (for webhooks)
PUT /api/v1/payments/:id/status
{
  "status": "completed",
  "transactionHash": "0x123..."
}

# Get payment analytics
GET /api/v1/payments/analytics/trends
```

#### Metrics
```bash
# Platform overview
GET /api/v1/metrics/overview

# Platform trends
GET /api/v1/metrics/trends?period=month

# Top performers
GET /api/v1/metrics/top-performers

# Blockchain events metrics
GET /api/v1/metrics/blockchain-events

# Real-time metrics
GET /api/v1/metrics/realtime
```

#### Webhooks
```bash
# Process blockchain events
POST /api/v1/webhooks/blockchain-events
{
  "events": [
    {
      "eventType": "GroupCreated",
      "contractAddress": "0x123...",
      "transactionHash": "0xabc...",
      "blockNumber": 12345,
      "logIndex": 0,
      "eventData": {...}
    }
  ]
}

# Webhook health check
GET /api/v1/webhooks/health
```

### WebSocket Events

#### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3001');

// Subscribe to updates
ws.send(JSON.stringify({
  type: 'subscribe',
  userId: 'user_address',
  address: 'wallet_address'
}));

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

#### Event Types
```json
{
  "type": "group_created",
  "data": { "group": {...}, "members": [...] }
}

{
  "type": "payment_completed",
  "data": { "payment": {...}, "group": {...} }
}

{
  "type": "group_updated",
  "data": { "group": {...}, "update": {...} }
}
```

## 🔧 Database Schema

### Core Tables
- **users**: User profiles and statistics
- **groups**: Group information and status
- **group_members**: Group membership and percentages
- **payments**: Payment transactions and status
- **update_requests**: Group update requests
- **events**: Blockchain event indexing

### Key Relationships
- Users can create multiple groups
- Groups have multiple members
- Payments link groups, senders, and receivers
- Events track blockchain activity

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   brew services list | grep postgresql
   
   # Start PostgreSQL if not running
   brew services start postgresql@14
   
   # Check database connection
   psql -h localhost -U swiftpay -d swiftpay_db -c "SELECT version();"
   ```

2. **Tables Don't Exist**
   ```bash
   # Check if tables exist
   psql -h localhost -U swiftpay -d swiftpay_db -c "\dt"
   
   # If no tables, restart the server
   npm run dev
   ```

3. **TypeScript Compilation Errors**
   ```bash
   # Clean and rebuild
   rm -rf dist/
   npm run build
   ```

4. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

5. **StarkNet Service Errors**
   - The service will run in read-only mode if contract address is not set
   - This is normal for development

### Logs
```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log

# View real-time logs
npm run dev
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   # Set production environment
   export NODE_ENV=production
   
   # Update .env for production
   NODE_ENV=production
   DB_HOST=your-production-db-host
   DB_PASSWORD=your-secure-password
   JWT_SECRET=your-very-secure-jwt-secret
   AUTOSHARE_CONTRACT_ADDRESS=your-deployed-contract-address
   ```

2. **Database Setup**
   ```bash
   # Create production database
   createdb swiftpay_production
   
   # Run migrations
   npm run build
   npm start
   ```

3. **Process Management**
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start dist/index.js --name swiftpay-backend
   
   # Monitor
   pm2 monit
   
   # View logs
   pm2 logs swiftpay-backend
   ```

### Docker Deployment
```bash
# Build image
docker build -t swiftpay-backend .

# Run container
docker run -p 3000:3000 -p 3001:3001 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  swiftpay-backend

# Or use docker-compose
docker-compose up -d
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 Monitoring

### Health Checks
```bash
# Application health
curl http://localhost:3000/health

# Webhook health
curl http://localhost:3000/api/v1/webhooks/health

# Database health
psql -h localhost -U swiftpay -d swiftpay_db -c "SELECT 1;"
```

### Metrics
```bash
# Platform overview
curl http://localhost:3000/api/v1/metrics/overview

# Real-time metrics
curl http://localhost:3000/api/v1/metrics/realtime
```

### Logs
- **Application logs**: `logs/combined.log`
- **Error logs**: `logs/error.log`
- **Console output**: Available in development mode

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- group.test.ts
```

### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test groups endpoint
curl http://localhost:3000/api/v1/groups

# Test user creation
curl http://localhost:3000/api/v1/users/0x1234567890123456789012345678901234567890123456789012345678901234

# Test metrics
curl http://localhost:3000/api/v1/metrics/overview
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with tests
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Submit pull request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Frontend**: [SwiftPay Frontend](https://github.com/your-org/swiftpay-frontend)
- **Smart Contract**: [AutoShare Contract](https://github.com/your-org/autoshare-contract)
- **Documentation**: [SwiftPay Docs](https://docs.swiftpay.com)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the logs for error details
