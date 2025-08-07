import request from 'supertest';
import express from 'express';
import { webhookRoutes } from '../routes/webhookRoutes';
import { TestDataSource } from './setup';
import { Event } from '../entities/Event';
import { Group } from '../entities/Group';
import { User } from '../entities/User';

// Mock the database module to use test data source
jest.mock('../config/database', () => ({
  getRepository: (entity: any) => TestDataSource.getRepository(entity)
}));

const app = express();
app.use(express.json());
app.use('/api/v1/webhooks', webhookRoutes);

describe('Webhook Routes', () => {
  beforeEach(async () => {
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  describe('POST /blockchain-events', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/blockchain-events')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should process GroupCreated event', async () => {
      const eventData = {
        events: [{
          eventType: 'GroupCreated',
          contractAddress: '0x123',
          transactionHash: '0xabc',
          blockNumber: 12345,
          logIndex: 0,
          eventData: {
            group_id: '1',
            name: 'Test Group',
            amount: '1000000000000000000000',
            creator: '0x456',
            transactionHash: '0xabc',
            blockNumber: 12345
          }
        }]
      };

      const response = await request(app)
        .post('/api/v1/webhooks/blockchain-events')
        .send(eventData)
        .expect(200);

      expect(response.body.message).toBe('Events processed successfully');
      expect(response.body.processedCount).toBe(1);

      // Check that event was saved
      const eventRepo = TestDataSource.getRepository(Event);
      const events = await eventRepo.find();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('GroupCreated');
      expect(events[0].isProcessed).toBe(true);
    });

    it('should process GroupUpdated event', async () => {
      // First create a group
      const userRepo = TestDataSource.getRepository(User);
      const groupRepo = TestDataSource.getRepository(Group);
      
      const user = userRepo.create({ 
        address: '0x456',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(user);

      const group = groupRepo.create({
        name: 'Old Name',
        amount: '1000000000000000000000',
        creatorAddress: '0x456',
        groupId: '1',
        memberCount: 2,
        isPaid: false,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash',
        blockNumber: 1
      });
      await groupRepo.save(group);

      const eventData = {
        events: [{
          eventType: 'GroupUpdated',
          contractAddress: '0x123',
          transactionHash: '0xdef',
          blockNumber: 12346,
          logIndex: 0,
          eventData: {
            group_id: '1',
            new_name: 'Updated Name',
            new_amount: '2000000000000000000000',
            transactionHash: '0xdef',
            blockNumber: 12346
          }
        }]
      };

      const response = await request(app)
        .post('/api/v1/webhooks/blockchain-events')
        .send(eventData)
        .expect(200);

      expect(response.body.message).toBe('Events processed successfully');
      expect(response.body.processedCount).toBe(1);

      // Check that group was updated
      const updatedGroup = await groupRepo.findOne({ where: { groupId: '1' } });
      expect(updatedGroup?.name).toBe('Updated Name');
      expect(updatedGroup?.amount).toBe(2000000000000000000000);
    });

    it('should process Payment event', async () => {
      // Create necessary users and group for the payment
      const userRepo = TestDataSource.getRepository(User);
      const groupRepo = TestDataSource.getRepository(Group);
      
      const fromUser = userRepo.create({ 
        address: '0x456',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(fromUser);

      const toUser = userRepo.create({ 
        address: '0x789',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(toUser);

      const group = groupRepo.create({
        name: 'Test Group',
        amount: '1000000000000000000000',
        creatorAddress: '0x456',
        groupId: '1',
        memberCount: 2,
        isPaid: false,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash',
        blockNumber: 1
      });
      await groupRepo.save(group);

      const eventData = {
        events: [{
          eventType: 'Payment',
          contractAddress: '0x123',
          transactionHash: '0xghi',
          blockNumber: 12347,
          logIndex: 0,
          eventData: {
            group_id: '1',
            from_address: '0x456',
            to_address: '0x789',
            amount: '500000000000000000000',
            token_address: '0xabc',
            transaction_hash: '0xghi',
            block_number: 12347
          }
        }]
      };

      const response = await request(app)
        .post('/api/v1/webhooks/blockchain-events')
        .send(eventData)
        .expect(200);

      expect(response.body.message).toBe('Events processed successfully');
      expect(response.body.processedCount).toBe(1);

      // Check that event was saved
      const eventRepo = TestDataSource.getRepository(Event);
      const events = await eventRepo.find();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('Payment');
      expect(events[0].isProcessed).toBe(true);
    });

    it('should handle multiple events', async () => {
      // Create necessary users for the payment
      const userRepo = TestDataSource.getRepository(User);
      
      const fromUser = userRepo.create({ 
        address: '0x456',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(fromUser);

      const toUser = userRepo.create({ 
        address: '0x789',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(toUser);

      const eventData = {
        events: [
          {
            eventType: 'GroupCreated',
            contractAddress: '0x123',
            transactionHash: '0xabc',
            blockNumber: 12345,
            logIndex: 0,
            eventData: {
              group_id: '1',
              name: 'Test Group',
              amount: '1000000000000000000000',
              creator: '0x456',
              transactionHash: '0xabc',
              blockNumber: 12345
            }
          },
          {
            eventType: 'Payment',
            contractAddress: '0x123',
            transactionHash: '0xdef',
            blockNumber: 12346,
            logIndex: 1,
            eventData: {
              group_id: '1',
              from_address: '0x456',
              to_address: '0x789',
              amount: '500000000000000000000',
              token_address: '0xabc',
              transaction_hash: '0xdef',
              block_number: 12346
            }
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/webhooks/blockchain-events')
        .send(eventData)
        .expect(200);

      expect(response.body.message).toBe('Events processed successfully');
      expect(response.body.processedCount).toBe(2);

      // Check that both events were saved
      const eventRepo = TestDataSource.getRepository(Event);
      const events = await eventRepo.find();
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('GroupCreated');
      expect(events[1].eventType).toBe('Payment');
    });

    it('should handle unknown event types gracefully', async () => {
      const eventData = {
        events: [{
          eventType: 'UnknownEvent',
          contractAddress: '0x123',
          transactionHash: '0xabc',
          blockNumber: 12345,
          logIndex: 0,
          eventData: {
            some_data: 'value'
          }
        }]
      };

      const response = await request(app)
        .post('/api/v1/webhooks/blockchain-events')
        .send(eventData)
        .expect(200);

      expect(response.body.message).toBe('Events processed successfully');
      expect(response.body.processedCount).toBe(1);

      // Check that event was still saved
      const eventRepo = TestDataSource.getRepository(Event);
      const events = await eventRepo.find();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UnknownEvent');
      expect(events[0].isProcessed).toBe(true);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.message).toBe('Webhook endpoint is healthy');
    });
  });
}); 