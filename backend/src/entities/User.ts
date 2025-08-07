import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Group } from './Group';
import { GroupMember } from './GroupMember';
import { Payment } from './Payment';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  address: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: 0 })
  totalGroupsCreated: number;

  @Column({ default: 0 })
  totalGroupsJoined: number;

  @Column({ default: 0 })
  totalAmountPaid: string; // BigInt as string

  @Column({ default: 0 })
  totalAmountReceived: string; // BigInt as string

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Group, (group: Group) => group.creator)
  createdGroups: Group[];

  @OneToMany(() => GroupMember, (member: GroupMember) => member.user)
  groupMemberships: GroupMember[];

  @OneToMany(() => Payment, (payment: Payment) => payment.fromUser)
  sentPayments: Payment[];

  @OneToMany(() => Payment, (payment: Payment) => payment.toUser)
  receivedPayments: Payment[];
} 