import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './Group';

@Entity('update_requests')
export class UpdateRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  requesterAddress: string;

  @Column()
  newName: string;

  @Column('decimal', { precision: 65, scale: 0 })
  newAmount: string; // BigInt as string

  @Column({ default: 0 })
  approvalCount: number;

  @Column({ default: false })
  feePaid: boolean;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ nullable: true })
  blockNumber?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Group, (group: Group) => group.updateRequests)
  @JoinColumn({ name: 'groupId', referencedColumnName: 'id' })
  group: Group;
} 