import { 
  bigint, 
  pgTable, 
  text, 
  uuid, 
  boolean, 
  timestamp, 
  integer,
  pgEnum
} from "drizzle-orm/pg-core";

// Enum for group status
export const groupStatusEnum = pgEnum("group_status", ["active", "paid", "updating"]);

// Groups table
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull().unique(),
  name: text("name").notNull(),
  is_paid: boolean("is_paid").notNull().default(false),
  creator: text("creator").notNull(), // ContractAddress as text
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  status: groupStatusEnum("status").default("active"),
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull(),
  member_address: text("member_address").notNull(), // ContractAddress as text
  percentage: integer("percentage").notNull(), // u8 as integer
  joined_at: timestamp("joined_at").defaultNow(),
});



// Update requests table
export const updateRequests = pgTable("update_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull().unique(),
  new_name: text("new_name").notNull(),
  requester: text("requester").notNull(), // ContractAddress as text
  fee_paid: boolean("fee_paid").notNull().default(false),
  approval_count: integer("approval_count").notNull().default(0),
  is_completed: boolean("is_completed").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Update request new members table
export const updateRequestNewMembers = pgTable("update_request_new_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull(),
  member_address: text("member_address").notNull(), // ContractAddress as text
  percentage: integer("percentage").notNull(), // u8 as integer
  created_at: timestamp("created_at").defaultNow(),
});

// Update approvals table
export const updateApprovals = pgTable("update_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull(),
  member_address: text("member_address").notNull(), // ContractAddress as text
  has_approved: boolean("has_approved").notNull().default(false),
  approved_at: timestamp("approved_at").defaultNow(),
});

// Pending updates table
export const pendingUpdates = pgTable("pending_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull().unique(),
  has_pending_update: boolean("has_pending_update").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Events table for tracking all contract events
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  event_type: text("event_type").notNull(), // GroupCreated, GroupPaid, etc.
  group_id: bigint("group_id", { mode: "number" }),
  transaction_hash: text("transaction_hash").notNull(),
  block_number: bigint("block_number", { mode: "number" }).notNull(),
  block_timestamp: bigint("block_timestamp", { mode: "number" }),
  event_data: text("event_data"), // JSON string of event data
  created_at: timestamp("created_at").defaultNow(),
});

// Group payments table
export const groupPayments = pgTable("group_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  paid_by: text("paid_by").notNull(), // ContractAddress as text
  paid_at: bigint("paid_at", { mode: "number" }).notNull(), // Block timestamp
  transaction_hash: text("transaction_hash").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Contract state table for tracking global contract state
export const contractState = pgTable("contract_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // e.g., "group_count", "admin", "token_address"
  value: text("value").notNull(), // Value as string
  updated_at: timestamp("updated_at").defaultNow(),
});

// Cursor table for Apibara state management
export const cursorTable = pgTable("cursor_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  endCursor: bigint("end_cursor", { mode: "number" }),
  uniqueKey: text("unique_key").unique(),
});

// Deployed groups table to track deployed group contract addresses
export const deployedGroups = pgTable("deployed_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull().unique(),
  deployed_address: text("deployed_address").notNull(), // The deployed group contract address
  is_active: boolean("is_active").notNull().default(true),
  deployment_block: bigint("deployment_block", { mode: "number" }).notNull(),
  deployment_timestamp: bigint("deployment_timestamp", { mode: "number" }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Token transfers table to track incoming tokens to group addresses
export const tokenTransfers = pgTable("token_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: bigint("group_id", { mode: "number" }).notNull(),
  deployed_address: text("deployed_address").notNull(), // Group contract address that received tokens
  token_address: text("token_address").notNull(), // ERC20 token contract address
  amount: bigint("amount", { mode: "number" }).notNull(),
  from_address: text("from_address").notNull(), // Address that sent the tokens
  transaction_hash: text("transaction_hash").notNull(),
  block_number: bigint("block_number", { mode: "number" }).notNull(),
  block_timestamp: bigint("block_timestamp", { mode: "number" }).notNull(),
  is_processed: boolean("is_processed").notNull().default(false), // Whether payment was triggered
  payment_tx_hash: text("payment_tx_hash"), // Hash of the payment transaction if triggered
  created_at: timestamp("created_at").defaultNow(),
});
