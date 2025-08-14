import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
  groups,
  groupMembers,
  updateRequests,
  updateRequestNewMembers,
  updateApprovals,
  pendingUpdates,
  events,
  groupPayments,
  contractState,
  groupStatusEnum,
} from "./schema";

// Type definitions for query results
export interface GroupWithMembers {
  group: typeof groups.$inferSelect;
  members: typeof groupMembers.$inferSelect[];
}

export interface GroupPaymentWithDetails {
  payment: typeof groupPayments.$inferSelect;
  group: typeof groups.$inferSelect;
}

export interface UpdateRequestWithDetails {
  request: typeof updateRequests.$inferSelect;
  group: typeof groups.$inferSelect;
  newMembers: typeof updateRequestNewMembers.$inferSelect[];
  approvals: typeof updateApprovals.$inferSelect[];
}

// Type for group status
export type GroupStatus = typeof groupStatusEnum.enumValues[number];

// Group queries
export const groupQueries = {
  // Get all groups with optional filters
  async getAllGroups(db: any, options?: {
    status?: GroupStatus;
    creator?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = db.select().from(groups);
    
    if (options?.status) {
      query = query.where(eq(groups.status, options.status));
    }
    
    if (options?.creator) {
      query = query.where(eq(groups.creator, options.creator));
    }
    
    query = query.orderBy(desc(groups.created_at));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  },

  // Get group by ID with members
  async getGroupById(db: any, groupId: number): Promise<GroupWithMembers | null> {
    const group = await db.query.groups.findFirst({
      where: eq(groups.group_id, groupId),
    });

    if (!group) return null;

    const members = await db.query.groupMembers.findMany({
      where: eq(groupMembers.group_id, groupId),
      orderBy: asc(groupMembers.joined_at),
    });

    return { group, members };
  },

  // Get groups by member address
  async getGroupsByMember(db: any, memberAddress: string) {
    return db
      .select({
        group: groups,
        member: groupMembers,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.group_id, groupMembers.group_id))
      .where(eq(groupMembers.member_address, memberAddress))
      .orderBy(desc(groups.created_at));
  },


};

// Update request queries
export const updateRequestQueries = {
  // Get all pending update requests
  async getPendingUpdateRequests(db: any) {
    return db.query.updateRequests.findMany({
      where: eq(updateRequests.is_completed, false),
      orderBy: desc(updateRequests.created_at),
    });
  },

  // Get update request details with group and new members
  async getUpdateRequestDetails(db: any, groupId: number): Promise<UpdateRequestWithDetails | null> {
    const request = await db.query.updateRequests.findFirst({
      where: eq(updateRequests.group_id, groupId),
    });

    if (!request) return null;

    const group = await db.query.groups.findFirst({
      where: eq(groups.group_id, groupId),
    });

    const newMembers = await db.query.updateRequestNewMembers.findMany({
      where: eq(updateRequestNewMembers.group_id, groupId),
    });

    const approvals = await db.query.updateApprovals.findMany({
      where: eq(updateApprovals.group_id, groupId),
    });

    return { request, group, newMembers, approvals };
  },

  // Get member approval status
  async getMemberApprovalStatus(db: any, groupId: number, memberAddress: string) {
    return db.query.updateApprovals.findFirst({
      where: and(
        eq(updateApprovals.group_id, groupId),
        eq(updateApprovals.member_address, memberAddress)
      ),
    });
  },

  // Get pending updates for a group
  async getPendingUpdateStatus(db: any, groupId: number) {
    return db.query.pendingUpdates.findFirst({
      where: eq(pendingUpdates.group_id, groupId),
    });
  },
};

// Payment queries
export const paymentQueries = {
  // Get payment history for a group
  async getGroupPaymentHistory(db: any, groupId: number) {
    return db.query.groupPayments.findMany({
      where: eq(groupPayments.group_id, groupId),
      orderBy: desc(groupPayments.paid_at),
    });
  },

  // Get all payments with group details
  async getAllPaymentsWithDetails(db: any, options?: {
    limit?: number;
    offset?: number;
  }): Promise<GroupPaymentWithDetails[]> {
    const payments = await db
      .select({
        payment: groupPayments,
        group: groups,
      })
      .from(groupPayments)
      .innerJoin(groups, eq(groupPayments.group_id, groups.group_id))
      .orderBy(desc(groupPayments.paid_at))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);

    return payments;
  },

  // Get total payments by address
  async getTotalPaymentsByAddress(db: any, address: string) {
    const result = await db
      .select({
        totalAmount: sql<number>`SUM(${groupPayments.amount})`,
        paymentCount: sql<number>`COUNT(*)`,
      })
      .from(groupPayments)
      .where(eq(groupPayments.paid_by, address));

    return result[0] || { totalAmount: 0, paymentCount: 0 };
  },
};

// Event queries
export const eventQueries = {
  // Get events by group ID
  async getEventsByGroup(db: any, groupId: number, options?: {
    eventType?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = db.query.events.findMany({
      where: eq(events.group_id, groupId),
      orderBy: desc(events.block_number),
    });

    if (options?.eventType) {
      query = query.where(eq(events.event_type, options.eventType));
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query;
  },

  // Get events by type
  async getEventsByType(db: any, eventType: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    return db.query.events.findMany({
      where: eq(events.event_type, eventType),
      orderBy: desc(events.block_number),
      limit: options?.limit || 100,
      offset: options?.offset || 0,
    });
  },

  // Get recent events
  async getRecentEvents(db: any, limit: number = 50) {
    return db.query.events.findMany({
      orderBy: desc(events.block_number),
      limit,
    });
  },
};

// Contract state queries
export const contractStateQueries = {
  // Get contract state value
  async getContractState(db: any, key: string) {
    const state = await db.query.contractState.findFirst({
      where: eq(contractState.key, key),
    });
    return state?.value;
  },

  // Update contract state
  async updateContractState(db: any, key: string, value: string) {
    return db.insert(contractState).values({ key, value }).onConflictDoUpdate({
      target: contractState.key,
      set: { value, updated_at: new Date() },
    });
  },

  // Get all contract state
  async getAllContractState(db: any) {
    return db.query.contractState.findMany({
      orderBy: asc(contractState.key),
    });
  },
};

// Analytics queries
export const analyticsQueries = {
  // Get group statistics
  async getGroupStats(db: any) {
    const totalGroups = await db.select({ count: sql<number>`COUNT(*)` }).from(groups);
    const activeGroups = await db.select({ count: sql<number>`COUNT(*)` }).from(groups).where(eq(groups.status, "active"));
    const paidGroups = await db.select({ count: sql<number>`COUNT(*)` }).from(groups).where(eq(groups.status, "paid"));
    const updatingGroups = await db.select({ count: sql<number>`COUNT(*)` }).from(groups).where(eq(groups.status, "updating"));

    return {
      total: totalGroups[0]?.count || 0,
      active: activeGroups[0]?.count || 0,
      paid: paidGroups[0]?.count || 0,
      updating: updatingGroups[0]?.count || 0,
    };
  },

  // Get payment statistics
  async getPaymentStats(db: any) {
    const totalPayments = await db.select({ count: sql<number>`COUNT(*)` }).from(groupPayments);
    const totalAmount = await db.select({ amount: sql<number>`SUM(${groupPayments.amount})` }).from(groupPayments);

    return {
      totalPayments: totalPayments[0]?.count || 0,
      totalAmount: totalAmount[0]?.amount || 0,
    };
  },

  // Get activity timeline
  async getActivityTimeline(db: any, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return db
      .select({
        date: sql<string>`DATE(${events.created_at})`,
        eventCount: sql<number>`COUNT(*)`,
        eventType: events.event_type,
      })
      .from(events)
      .where(sql`${events.created_at} >= ${cutoffDate}`)
      .groupBy(sql`DATE(${events.created_at}), ${events.event_type}`)
      .orderBy(asc(sql`DATE(${events.created_at})`));
  },
}; 