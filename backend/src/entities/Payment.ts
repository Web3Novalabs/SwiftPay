import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Group } from './Group';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column('decimal', { precision: 65, scale: 0 })
  amount: string; // BigInt as string

  @Column()
  tokenAddress: string;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ nullable: true })
  blockNumber?: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'failed';

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Group, (group: Group) => group.payments)
  @JoinColumn({ name: 'groupId', referencedColumnName: 'id' })
  group: Group;

  @ManyToOne(() => User, (user: User) => user.sentPayments)
  @JoinColumn({ name: 'fromAddress', referencedColumnName: 'address' })
  fromUser: User;

  @ManyToOne(() => User, (user: User) => user.receivedPayments)
  @JoinColumn({ name: 'toAddress', referencedColumnName: 'address' })
  toUser: User;
} 