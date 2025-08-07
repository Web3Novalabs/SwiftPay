import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { GroupMember } from './GroupMember';
import { Payment } from './Payment';
import { UpdateRequest } from './UpdateRequest';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string; // Smart contract group ID

  @Column()
  name: string;

  @Column('decimal', { precision: 65, scale: 0 })
  amount: string; // BigInt as string

  @Column({ default: false })
  isPaid: boolean;

  @Column()
  creatorAddress: string;

  @Column({ nullable: true })
  tokenAddress: string;

  @Column({ default: 0 })
  memberCount: number;

  @Column({ default: 0 })
  approvalCount: number;

  @Column({ default: false })
  hasPendingUpdate: boolean;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ nullable: true })
  blockNumber?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.createdGroups)
  @JoinColumn({ name: 'creatorAddress', referencedColumnName: 'address' })
  creator: User;

  @OneToMany(() => GroupMember, (member: GroupMember) => member.group)
  members: GroupMember[];

  @OneToMany(() => Payment, (payment: Payment) => payment.group)
  payments: Payment[];

  @OneToMany(() => UpdateRequest, (updateRequest: UpdateRequest) => updateRequest.group)
  updateRequests: UpdateRequest[];
} 