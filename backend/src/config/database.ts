import { DataSource } from 'typeorm';
import { logger } from '../utils/logger';
import { User } from '../entities/User';
import { Group } from '../entities/Group';
import { GroupMember } from '../entities/GroupMember';
import { Payment } from '../entities/Payment';
import { UpdateRequest } from '../entities/UpdateRequest';
import { Event } from '../entities/Event';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'swiftpay',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'swiftpay_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Group, GroupMember, Payment, UpdateRequest, Event],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const setupDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Database connection established');
    
    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      await AppDataSource.runMigrations();
      logger.info('✅ Database migrations completed');
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const getRepository = <T>(entity: new () => T) => {
  return AppDataSource.getRepository(entity);
}; 