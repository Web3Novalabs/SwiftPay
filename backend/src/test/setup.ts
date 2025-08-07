import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Group } from '../entities/Group';
import { GroupMember } from '../entities/GroupMember';
import { Payment } from '../entities/Payment';
import { UpdateRequest } from '../entities/UpdateRequest';
import { Event } from '../entities/Event';

// Test database configuration
export const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [User, Group, GroupMember, Payment, UpdateRequest, Event],
  synchronize: true,
  logging: false,
});

// Global test setup
beforeAll(async () => {
  await TestDataSource.initialize();
});

// Global test teardown
afterAll(async () => {
  await TestDataSource.destroy();
});

// Clean database between tests
beforeEach(async () => {
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.clear();
  }
}); 