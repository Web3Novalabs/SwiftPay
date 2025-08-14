import express from "express";
import cors from "cors";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/schema";
import * as queries from "../lib/queries";
import { eq, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectionString = process.env.POSTGRES_CONNECTION_STRING;
let db: any;

if (connectionString) {
  const client = postgres(connectionString);
  db = drizzle(client, { schema });
} else {
  console.log("No database connection string provided, using mock data");
  // Mock database for demonstration
  db = {
    query: {
      groups: {
        findFirst: async () => null,
        findMany: async () => [],
      },
      events: {
        findMany: async () => [],
      },
    },
  };
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Groups endpoints
app.get("/api/groups", async (req, res) => {
  try {
    const { status, creator, limit = 50, offset = 0 } = req.query;
    
    const groups = await queries.groupQueries.getAllGroups(db, {
      status: status as "active" | "paid" | "updating" | undefined,
      creator: creator as string,
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ success: false, error: "Failed to fetch groups" });
  }
});

app.get("/api/groups/:id", async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const group = await queries.groupQueries.getGroupById(db, groupId);
    
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    
    res.json({ success: true, data: group });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ success: false, error: "Failed to fetch group" });
  }
});

app.get("/api/groups/:id/members", async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const members = await db.query.groupMembers.findMany({
      where: (groupMembers: any) => eq(groupMembers.group_id, groupId),
      orderBy: (groupMembers: any) => asc(groupMembers.joined_at),
    });
    
    res.json({ success: true, data: members });
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ success: false, error: "Failed to fetch group members" });
  }
});

// Events endpoints
app.get("/api/events", async (req, res) => {
  try {
    const { group_id, event_type, limit = 50, offset = 0 } = req.query;
    
    if (group_id) {
      const events = await queries.eventQueries.getEventsByGroup(db, Number(group_id), {
        eventType: event_type as string,
        limit: Number(limit),
        offset: Number(offset),
      });
      res.json({ success: true, data: events });
    } else {
      const events = await queries.eventQueries.getRecentEvents(db, Number(limit));
      res.json({ success: true, data: events });
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

app.get("/api/events/:type", async (req, res) => {
  try {
    const eventType = req.params.type;
    const { limit = 50, offset = 0 } = req.query;
    
    const events = await queries.eventQueries.getEventsByType(db, eventType, {
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching events by type:", error);
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

// Payments endpoints
app.get("/api/payments", async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const payments = await queries.paymentQueries.getAllPaymentsWithDetails(db, {
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
});

app.get("/api/payments/group/:groupId", async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const payments = await queries.paymentQueries.getGroupPaymentHistory(db, groupId);
    
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error fetching group payments:", error);
    res.status(500).json({ success: false, error: "Failed to fetch group payments" });
  }
});

// Update requests endpoints
app.get("/api/updates/pending", async (req, res) => {
  try {
    const requests = await queries.updateRequestQueries.getPendingUpdateRequests(db);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching pending updates:", error);
    res.status(500).json({ success: false, error: "Failed to fetch pending updates" });
  }
});

app.get("/api/updates/:groupId", async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const updateDetails = await queries.updateRequestQueries.getUpdateRequestDetails(db, groupId);
    
    if (!updateDetails) {
      return res.status(404).json({ success: false, error: "Update request not found" });
    }
    
    res.json({ success: true, data: updateDetails });
  } catch (error) {
    console.error("Error fetching update details:", error);
    res.status(500).json({ success: false, error: "Failed to fetch update details" });
  }
});

// Analytics endpoints
app.get("/api/analytics/stats", async (req, res) => {
  try {
    const [groupStats, paymentStats] = await Promise.all([
      queries.analyticsQueries.getGroupStats(db),
      queries.analyticsQueries.getPaymentStats(db),
    ]);
    
    res.json({
      success: true,
      data: {
        groups: groupStats,
        payments: paymentStats,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

app.get("/api/analytics/timeline", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const timeline = await queries.analyticsQueries.getActivityTimeline(db, Number(days));
    
    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ success: false, error: "Failed to fetch timeline" });
  }
});

// Search endpoint
app.get("/api/search", async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: "Search query required" });
    }
    
    let results: any[] = [];
    
    if (!type || type === "groups") {
      // Search groups by name
      const groups = await db
        .select()
        .from(schema.groups)
        .where(sql`${schema.groups.name} ILIKE ${`%${q}%`}`);
      
      results.push(...groups.map((g: any) => ({ type: "group", data: g })));
    }
    
    if (!type || type === "addresses") {
      // Search by address (creator, member, etc.)
      const addressGroups = await db
        .select()
        .from(schema.groups)
        .where(sql`${schema.groups.creator} ILIKE ${`%${q}%`}`);
      
      results.push(...addressGroups.map((g: any) => ({ type: "address", data: g })));
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ success: false, error: "Failed to search" });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`AutoShare Indexer API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

export default app; 