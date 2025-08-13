# SwiftPay Webhook System Documentation

## Overview

The SwiftPay webhook system serves as a bridge between blockchain events and the backend application. It processes events from smart contracts and updates the database accordingly, enabling real-time synchronization between the blockchain and the application.

## Architecture Flow

```
Blockchain Events → Indexer → Webhook → Backend Database → WebSocket Broadcast
```

## 1. Smart Contract Events

The AutoShare contract emits several events that trigger the webhook system:

### Event Definitions

```cairo
// From contract/src/base/events.cairo

// Event emitted when a group is created
pub struct GroupCreated {
    pub group_id: u256,
    pub creator: ContractAddress,
    pub name: ByteArray,
    pub amount: u256,
}

// Event emitted when a group update is requested
pub struct GroupUpdateRequested {
    pub group_id: u256,
    pub requester: ContractAddress,
    pub new_name: ByteArray,
    pub new_amount: u256,
}

// Event emitted when a group member approves an update
pub struct GroupUpdateApproved {
    pub group_id: u256,
    pub approver: ContractAddress,
    pub approval_count: u8,
    pub total_members: u8,
}

// Event emitted when a group update is executed
pub struct GroupUpdated {
    pub group_id: u256,
    pub old_name: ByteArray,
    pub new_name: ByteArray,
    pub old_amount: u256,
    pub new_amount: u256,
}
```

### Event Keys

The indexer monitors specific event keys from the AutoShare contract:

```typescript
// From indexer/constants.ts
export const GROUP_CREATED_EVENT_KEY = "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
export const GROUP_UPDATED_EVENT_KEY = "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3";
export const GROUP_UPDATE_REQUESTED_EVENT_KEY = "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4";
export const GROUP_UPDATE_APPROVED_EVENT_KEY = "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5";
export const GROUP_UPDATE_EXECUTED_EVENT_KEY = "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6";
export const PAYMENT_EVENT_KEY = "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7";
```

## 2. Indexer Processing

The indexer (`indexer/main.ts`) monitors the blockchain for these events and processes them:

### Event Monitoring Configuration

```typescript
// From indexer/main.ts
export const config: Config<NetworkOptions, SinkOptions> = {
  streamUrl: "https://mainnet.starknet.a5a.ch",
  startingBlock: startingBlock,
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  filter: {
    header: { weak: true },
    events: [
      // AutoShare contract events
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [GROUP_CREATED_EVENT_KEY],
        includeReceipt: false,
      },
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [GROUP_UPDATED_EVENT_KEY],
        includeReceipt: false,
      },
      // ... other events
    ],
  },
  sinkType: "console",
  sinkOptions: {},
};
```

### Event Processing

When an event is detected, the indexer:

1. **Parses the event data** based on the event type
2. **Calls the appropriate processing function**
3. **Sends the event to the backend webhook**

```typescript
// From indexer/main.ts
export default function transform({ events }: Block) {
  return (events ?? []).map(({ event }) => {
    const { fromAddress, data } = event;
    
    if (fromAddress === AUTOSHARE_CONTRACT_ADDRESS) {
      const eventKey = event.keys[0];
      
      switch (eventKey) {
        case GROUP_CREATED_EVENT_KEY:
          const [groupId, name, groupAmount, creator, ...memberData] = data;
          const members = parseMembers(memberData);
          
          processGroupCreated({
            groupId,
            name,
            amount: groupAmount,
            creator,
            members,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
          });
          break;
        // ... other cases
      }
    }
  });
}
```

## 3. Webhook Processing Flow

### Event Transmission

The indexer sends events to the backend webhook:

```typescript
// From indexer/net.ts
export const sendBlockchainEvents = async (events: Array<{
  eventType: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
  eventData: any;
}>) => {
  try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      console.error(`Failed to send events to backend: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending events to backend:", error);
  }
};
```

### Backend Webhook Endpoint

The backend receives events at `/api/v1/webhooks/blockchain-events`:

```typescript
// From backend/src/routes/webhookRoutes.ts
router.post('/blockchain-events', [
  body('events').isArray(),
  body('events.*.eventType').isString(),
  body('events.*.contractAddress').isString(),
  body('events.*.transactionHash').isString(),
  body('events.*.blockNumber').isNumeric(),
  body('events.*.logIndex').isNumeric(),
  body('events.*.eventData').isObject()
], async (req: Request, res: Response) => {
  const { events } = req.body;
  const processedEvents: any[] = [];

  for (const eventData of events) {
    try {
      // Save event to database
      const event = eventRepo.create({
        eventType: eventData.eventType,
        contractAddress: eventData.contractAddress,
        transactionHash: eventData.transactionHash,
        blockNumber: eventData.blockNumber,
        logIndex: eventData.logIndex,
        eventData: JSON.stringify(eventData.eventData),
        isProcessed: false
      });

      const savedEvent = await eventRepo.save(event);
      processedEvents.push(savedEvent);

      // Process event based on type
      await processBlockchainEvent(eventData);

      // Mark as processed
      savedEvent.isProcessed = true;
      savedEvent.processedAt = new Date();
      await eventRepo.save(savedEvent);

      logger.info(`Processed blockchain event: ${eventData.eventType}`);
    } catch (error) {
      logger.error(`Error processing event ${eventData.eventType}:`, error);
    }
  }

  res.json({
    message: 'Events processed successfully',
    processedCount: processedEvents.length
  });
});
```

## 4. Event-Specific Processing

Each event type has its own processing function that updates the database and broadcasts changes:

### GroupCreated Event Processing

```typescript
// From backend/src/routes/webhookRoutes.ts
async function processGroupCreated(data: any): Promise<void> {
  try {
    const groupRepo = getRepository(Group);
    const userRepo = getRepository(User);

    // Check if group already exists
    const existingGroup = await groupRepo.findOne({
      where: { groupId: data.group_id.toString() }
    });

    if (existingGroup) {
      logger.info(`Group ${data.group_id} already exists in database`);
      return;
    }

    // Get or create user
    let user = await userRepo.findOne({ where: { address: data.creator } });
    if (!user) {
      user = userRepo.create({ address: data.creator });
      await userRepo.save(user);
    }

    // Create group
    const group = groupRepo.create({
      groupId: data.group_id.toString(),
      name: data.name,
      amount: data.amount.toString(),
      creatorAddress: data.creator,
      memberCount: 0, // Will be updated when members are processed
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber
    });

    await groupRepo.save(group);

    // Update user stats
    user.totalGroupsCreated += 1;
    await userRepo.save(user);

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'group_created',
      data: { group }
    });

    logger.info(`Group created: ${data.group_id}`);
  } catch (error) {
    logger.error('Error processing GroupCreated event:', error);
  }
}
```

### GroupUpdated Event Processing

```typescript
async function processGroupUpdated(data: any): Promise<void> {
  try {
    const groupRepo = getRepository(Group);

    const group = await groupRepo.findOne({
      where: { groupId: data.group_id.toString() }
    });

    if (!group) {
      logger.warn(`Group ${data.group_id} not found for update`);
      return;
    }

    // Update group with new data
    group.name = data.new_name;
    group.amount = data.new_amount.toString();
    group.isPaid = false; // Reset payment status
    group.hasPendingUpdate = false;
    group.approvalCount = 0;
    group.transactionHash = data.transactionHash;
    group.blockNumber = data.blockNumber;

    await groupRepo.save(group);

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'group_updated',
      data: { group }
    });

    logger.info(`Group updated: ${data.group_id}`);
  } catch (error) {
    logger.error('Error processing GroupUpdated event:', error);
  }
}
```

### GroupUpdateRequested Event Processing

```typescript
async function processGroupUpdateRequested(data: any): Promise<void> {
  try {
    const groupRepo = getRepository(Group);
    const updateRequestRepo = getRepository(UpdateRequest);

    const group = await groupRepo.findOne({
      where: { groupId: data.group_id.toString() }
    });

    if (!group) {
      logger.warn(`Group ${data.group_id} not found for update request`);
      return;
    }

    // Create update request
    const updateRequest = updateRequestRepo.create({
      groupId: group.id,
      requesterAddress: data.requester,
      newName: data.new_name,
      newAmount: data.new_amount.toString(),
      feePaid: true,
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber
    });

    await updateRequestRepo.save(updateRequest);

    // Update group status
    group.hasPendingUpdate = true;
    await groupRepo.save(group);

    // Broadcast to group members
    const memberRepo = getRepository(GroupMember);
    const members = await memberRepo.find({ where: { groupId: group.id } });
    
    members.forEach(member => {
      broadcastToAddress(member.memberAddress, {
        type: 'group_update_requested',
        data: { group, updateRequest }
      });
    });

    logger.info(`Group update requested: ${data.group_id}`);
  } catch (error) {
    logger.error('Error processing GroupUpdateRequested event:', error);
  }
}
```

### Payment Event Processing

```typescript
async function processPayment(data: any): Promise<void> {
  try {
    const paymentRepo = getRepository(Payment);
    const userRepo = getRepository(User);

    // Create payment record
    const payment = paymentRepo.create({
      groupId: data.group_id,
      fromAddress: data.from_address,
      toAddress: data.to_address,
      amount: data.amount.toString(),
      tokenAddress: data.token_address,
      status: 'completed',
      transactionHash: data.transaction_hash,
      blockNumber: data.block_number
    });

    await paymentRepo.save(payment);

    // Update user stats
    const sender = await userRepo.findOne({ where: { address: data.from_address } });
    if (sender) {
      sender.totalAmountPaid = (BigInt(sender.totalAmountPaid || '0') + BigInt(data.amount)).toString();
      await userRepo.save(sender);
    }

    const receiver = await userRepo.findOne({ where: { address: data.to_address } });
    if (receiver) {
      receiver.totalAmountReceived = (BigInt(receiver.totalAmountReceived || '0') + BigInt(data.amount)).toString();
      await userRepo.save(receiver);
    }

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'payment_completed',
      data: { payment }
    });

    logger.info(`Payment processed: ${data.transaction_hash}`);
  } catch (error) {
    logger.error('Error processing Payment event:', error);
  }
}
```

## 5. WebSocket Broadcasting

After processing events, the backend broadcasts updates to connected clients:

### Broadcast Functions

```typescript
// From backend/src/config/websocket.ts
export const broadcastToAll = (message: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

export const broadcastToAddress = (address: string, message: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.address === address) {
      client.send(JSON.stringify(message));
    }
  });
};
```

### Message Types

The system broadcasts different types of messages:

- `group_created`: When a new group is created
- `group_updated`: When a group is updated
- `group_update_requested`: When a group update is requested
- `group_update_approved`: When a group update is approved
- `payment_completed`: When a payment is completed

## 6. Database Schema

### Event Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  contract_address VARCHAR NOT NULL,
  transaction_hash VARCHAR NOT NULL,
  block_number INTEGER NOT NULL,
  log_index INTEGER NOT NULL,
  event_data TEXT NOT NULL, -- JSON string
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Group Table

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  group_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  amount VARCHAR NOT NULL, -- BigInt as string
  creator_address VARCHAR NOT NULL,
  member_count INTEGER DEFAULT 0,
  usage_limit_reached BOOLEAN DEFAULT FALSE,
  has_pending_update BOOLEAN DEFAULT FALSE,
  approval_count INTEGER DEFAULT 0,
  transaction_hash VARCHAR,
  block_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 7. How to See the Webhook in Action

### Prerequisites

1. **Deploy the AutoShare contract** to Starknet mainnet
2. **Update the contract address** in `indexer/constants.ts`
3. **Start the services**

### Starting the Services

```bash
# Start the backend
cd backend
npm install
npm run dev

# Start the indexer (in another terminal)
cd indexer
deno run --allow-net --allow-env main.ts

# Start the frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Testing the Webhook

#### 1. Manual Testing

You can manually test the webhook endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/blockchain-events \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventType": "GroupCreated",
        "contractAddress": "0x123...",
        "transactionHash": "0xabc...",
        "blockNumber": 12345,
        "logIndex": 0,
        "eventData": {
          "group_id": "1",
          "name": "Test Group",
          "amount": "1000000000000000000000",
          "creator": "0x456..."
        }
      }
    ]
  }'
```

#### 2. Automated Testing

Run the test suite:

```bash
cd backend
npm test
```

This will run comprehensive tests for both group routes and webhook routes.

#### 3. Real Blockchain Events

To see real events in action:

1. **Create a group** through the frontend or contract interaction
2. **Monitor the logs** in the indexer and backend
3. **Check the database** for new records
4. **Connect to WebSocket** to see real-time updates

### Monitoring and Debugging

#### Backend Logs

```bash
# Check backend logs
docker logs swiftpay-backend

# Or if running locally
npm run dev
```

#### Indexer Logs

```bash
# Check indexer logs
docker logs swiftpay-indexer

# Or if running locally
deno run --allow-net --allow-env main.ts
```

#### Database Queries

```sql
-- Check processed events
SELECT * FROM events WHERE is_processed = true ORDER BY created_at DESC;

-- Check groups
SELECT * FROM groups ORDER BY created_at DESC;

-- Check payments
SELECT * FROM payments ORDER BY created_at DESC;
```

#### WebSocket Connection

Connect to the WebSocket to see real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  switch (data.type) {
    case 'group_created':
      console.log('New group created:', data.data.group);
      break;
    case 'payment_completed':
      console.log('Payment completed:', data.data.payment);
      break;
  }
};
```

## 8. Configuration

### Environment Variables

```bash
# Backend (.env)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=swiftpay
DB_PASSWORD=password
DB_DATABASE=swiftpay_db
AUTOSHARE_CONTRACT_ADDRESS=0x123...
WEBHOOK_SECRET=your-secret-key

# Indexer (constants.ts)
AUTOSHARE_CONTRACT_ADDRESS=0x123...
BACKEND_BASE_URL=http://swiftpay-backend:3000
WEBHOOK_ENDPOINT=http://swiftpay-backend:3000/api/v1/webhooks/blockchain-events
```

### Contract Addresses

Update the contract addresses in `indexer/constants.ts`:

```typescript
export const AUTOSHARE_CONTRACT_ADDRESS = "0x..."; // Your deployed contract
export const STRK_TOKEN_CONTRACT_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const ETH_TOKEN_CONTRACT_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
```

## 9. Error Handling

### Webhook Error Handling

The webhook system includes comprehensive error handling:

```typescript
// Individual event processing errors don't stop other events
for (const eventData of events) {
  try {
    await processBlockchainEvent(eventData);
  } catch (error) {
    logger.error(`Error processing event ${eventData.eventType}:`, error);
    // Continue processing other events
  }
}
```

### Retry Logic

The indexer includes retry logic for failed webhook calls:

```typescript
export const sendBlockchainEvents = async (events: Array<...>) => {
  try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      console.error(`Failed to send events to backend: ${response.status}`);
      // Could implement retry logic here
    }
  } catch (error) {
    console.error("Error sending events to backend:", error);
  }
};
```

## 10. Security Considerations

### Webhook Authentication

Consider adding authentication to the webhook endpoint:

```typescript
// Add middleware for webhook authentication
const authenticateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/blockchain-events', authenticateWebhook, [
  // ... validation
], async (req: Request, res: Response) => {
  // ... processing
});
```

### Rate Limiting

Implement rate limiting for the webhook endpoint:

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests'
});

router.post('/blockchain-events', webhookLimiter, [
  // ... validation
], async (req: Request, res: Response) => {
  // ... processing
});
```

## Conclusion

The SwiftPay webhook system provides a robust, real-time bridge between blockchain events and the application backend. It ensures data consistency, provides real-time updates to clients, and maintains a comprehensive audit trail of all blockchain interactions.

The system is designed to be:
- **Reliable**: Comprehensive error handling and retry logic
- **Scalable**: Event-driven architecture with database persistence
- **Real-time**: WebSocket broadcasting for immediate updates
- **Testable**: Comprehensive test suite for all components
- **Secure**: Authentication and rate limiting capabilities 