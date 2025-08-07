import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Group } from './Group';

@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  memberAddress: string;

  @Column()
  percentage: number; // Percentage as integer (e.g., 25 for 25%)

  @Column({ default: false })
  hasApprovedUpdate: boolean;

  @Column({ nullable: true })
  lastApprovalDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Group, (group: Group) => group.members)
  @JoinColumn({ name: 'groupId', referencedColumnName: 'id' })
  group: Group;

  @ManyToOne(() => User, (user: User) => user.groupMemberships)
  @JoinColumn({ name: 'memberAddress', referencedColumnName: 'address' })
  user: User;
} 