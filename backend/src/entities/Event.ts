import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('events')
@Index(['eventType', 'blockNumber'])
@Index(['contractAddress', 'blockNumber'])
@Index(['transactionHash'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventType: string; // 'GroupCreated', 'GroupUpdated', 'Payment', etc.

  @Column()
  contractAddress: string;

  @Column()
  transactionHash: string;

  @Column()
  blockNumber: number;

  @Column()
  logIndex: number;

  @Column('text')
  eventData: string; // Store event parameters as JSON string

  @Column({ default: false })
  isProcessed: boolean;

  @Column({ nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
} 