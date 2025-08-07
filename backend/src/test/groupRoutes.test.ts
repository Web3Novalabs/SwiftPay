import request from 'supertest';
import express from 'express';
import { groupRoutes } from '../routes/groupRoutes';
import { TestDataSource } from './setup';
import { Group } from '../entities/Group';
import { User } from '../entities/User';
import { GroupMember } from '../entities/GroupMember';

// Mock the database module to use test data source
jest.mock('../config/database', () => ({
  getRepository: (entity: any) => TestDataSource.getRepository(entity)
}));

const app = express();
app.use(express.json());
app.use('/api/v1/groups', groupRoutes);

describe('Group Routes', () => {

  beforeEach(async () => {
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  describe('GET /', () => {
    it('should return empty groups list when no groups exist', async () => {
      const response = await request(app)
        .get('/api/v1/groups')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
    });

    it('should return groups with pagination', async () => {
      // Create test data
      const userRepo = TestDataSource.getRepository(User);
      const groupRepo = TestDataSource.getRepository(Group);
      
      const user = userRepo.create({ 
        address: '0x123',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(user);

      const group = groupRepo.create({
        name: 'Test Group',
        amount: '1000000000000000000000',
        creatorAddress: '0x123',
        groupId: '1',
        memberCount: 2,
        isPaid: false,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash',
        blockNumber: 1
      });
      await groupRepo.save(group);

      const response = await request(app)
        .get('/api/v1/groups')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Group');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter groups by payment status', async () => {
      const userRepo = TestDataSource.getRepository(User);
      const groupRepo = TestDataSource.getRepository(Group);
      
      const user = userRepo.create({ 
        address: '0x123',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(user);

      // Create paid and unpaid groups
      const paidGroup = groupRepo.create({
        name: 'Paid Group',
        amount: '1000000000000000000000',
        creatorAddress: '0x123',
        groupId: '1',
        memberCount: 2,
        isPaid: true,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash-1',
        blockNumber: 1
      });
      await groupRepo.save(paidGroup);

      const unpaidGroup = groupRepo.create({
        name: 'Unpaid Group',
        amount: '2000000000000000000000',
        creatorAddress: '0x123',
        groupId: '2',
        memberCount: 3,
        isPaid: false,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash-2',
        blockNumber: 2
      });
      await groupRepo.save(unpaidGroup);

      // Test paid filter
      const paidResponse = await request(app)
        .get('/api/v1/groups?isPaid=true')
        .expect(200);

      expect(paidResponse.body.data).toHaveLength(1);
      expect(paidResponse.body.data[0].name).toBe('Paid Group');

      // Test unpaid filter
      const unpaidResponse = await request(app)
        .get('/api/v1/groups?isPaid=false')
        .expect(200);

      expect(unpaidResponse.body.data).toHaveLength(1);
      expect(unpaidResponse.body.data[0].name).toBe('Unpaid Group');
    });
  });

  describe('GET /:id', () => {
    it('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .get('/api/v1/groups/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);

      expect(response.body.error.message).toBe('Group not found');
    });

    it('should return group by ID with relations', async () => {
      const userRepo = TestDataSource.getRepository(User);
      const groupRepo = TestDataSource.getRepository(Group);
      const memberRepo = TestDataSource.getRepository(GroupMember);
      
      const user = userRepo.create({ 
        address: '0x123',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(user);

      const group = groupRepo.create({
        name: 'Test Group',
        amount: '1000000000000000000000',
        creatorAddress: '0x123',
        groupId: '1',
        memberCount: 2,
        isPaid: false,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash',
        blockNumber: 1
      });
      const savedGroup = await groupRepo.save(group);

      // Create user for member
      const memberUser = userRepo.create({ 
        address: '0x456',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(memberUser);

      const member = memberRepo.create({
        groupId: savedGroup.id,
        memberAddress: '0x456',
        percentage: 50,
        hasApprovedUpdate: false
      });
      await memberRepo.save(member);

      const response = await request(app)
        .get(`/api/v1/groups/${savedGroup.id}`)
        .expect(200);

      expect(response.body.data.id).toBe(savedGroup.id);
      expect(response.body.data.name).toBe('Test Group');
      expect(response.body.data.members).toHaveLength(1);
    });
  });

  describe('POST /', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/groups')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should validate group name length', async () => {
      const groupData = {
        name: '', // Empty name
        amount: '1000000000000000000000',
        members: [
          { addr: '0x123', percentage: 50 },
          { addr: '0x456', percentage: 50 }
        ],
        tokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        creatorAddress: '0x789',
        privateKey: 'test-key'
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .send(groupData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate amount format', async () => {
      const groupData = {
        name: 'Test Group',
        amount: 'invalid-amount', // Invalid amount
        members: [
          { addr: '0x123', percentage: 50 },
          { addr: '0x456', percentage: 50 }
        ],
        tokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        creatorAddress: '0x789',
        privateKey: 'test-key'
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .send(groupData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate minimum number of members', async () => {
      const groupData = {
        name: 'Test Group',
        amount: '1000000000000000000000',
        members: [
          { addr: '0x123', percentage: 100 } // Only one member
        ],
        tokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        creatorAddress: '0x789',
        privateKey: 'test-key'
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .send(groupData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate percentage totals 100%', async () => {
      const groupData = {
        name: 'Test Group',
        amount: '1000000000000000000000',
        members: [
          { addr: '0x123', percentage: 50 },
          { addr: '0x456', percentage: 30 } // Total 80%, should be 100%
        ],
        tokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        creatorAddress: '0x789',
        privateKey: 'test-key'
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .send(groupData)
        .expect(400);

      expect(response.body.error.message).toBe('Total percentage must equal 100%');
    });

    it('should validate member address format', async () => {
      const groupData = {
        name: 'Test Group',
        amount: '1000000000000000000000',
        members: [
          { addr: '', percentage: 50 }, // Empty address
          { addr: '0x456', percentage: 50 }
        ],
        tokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        creatorAddress: '0x789',
        privateKey: 'test-key'
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .send(groupData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate percentage range', async () => {
      const groupData = {
        name: 'Test Group',
        amount: '1000000000000000000000',
        members: [
          { addr: '0x123', percentage: 0 }, // Invalid percentage
          { addr: '0x456', percentage: 100 }
        ],
        tokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        creatorAddress: '0x789',
        privateKey: 'test-key'
      };

      const response = await request(app)
        .post('/api/v1/groups')
        .send(groupData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /address/:address', () => {
    it('should return groups for a specific address', async () => {
      const userRepo = TestDataSource.getRepository(User);
      const groupRepo = TestDataSource.getRepository(Group);
      const memberRepo = TestDataSource.getRepository(GroupMember);
      
      const user = userRepo.create({ 
        address: '0x123',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(user);

      // Create group where user is creator
      const creatorGroup = groupRepo.create({
        name: 'Creator Group',
        amount: '1000000000000000000000',
        creatorAddress: '0x123',
        groupId: '1',
        memberCount: 2,
        isPaid: false,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash-1',
        blockNumber: 1
      });
      await groupRepo.save(creatorGroup);

      // Create user for the second group creator
      const creatorUser = userRepo.create({ 
        address: '0x789',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(creatorUser);

      // Create group where user is member
      const memberGroup = groupRepo.create({
        name: 'Member Group',
        amount: '2000000000000000000000',
        creatorAddress: '0x789',
        groupId: '2',
        memberCount: 3,
        isPaid: false,
        hasPendingUpdate: false,
        approvalCount: 0,
        transactionHash: 'test-hash-2',
        blockNumber: 2
      });
      const savedMemberGroup = await groupRepo.save(memberGroup);

      // Create user for the member address (0x123 is already created above)
      const memberAddressUser = userRepo.create({ 
        address: '0x456',
        totalGroupsCreated: 0,
        totalAmountPaid: '0',
        totalAmountReceived: '0'
      });
      await userRepo.save(memberAddressUser);

      const member = memberRepo.create({
        groupId: savedMemberGroup.id,
        memberAddress: '0x123',
        percentage: 50,
        hasApprovedUpdate: false
      });
      await memberRepo.save(member);

      const response = await request(app)
        .get('/api/v1/groups/address/0x123')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.some((g: any) => g.name === 'Creator Group')).toBe(true);
      expect(response.body.data.some((g: any) => g.name === 'Member Group')).toBe(true);
    });

    it('should return empty array for address with no groups', async () => {
      const response = await request(app)
        .get('/api/v1/groups/address/0x999')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });
}); 