import { pgTable, text, boolean, timestamp, integer, bigint, uuid } from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: integer("id").primaryKey().notNull(),
  group_id: integer("group_id").unique().notNull(),
  name: text("name").notNull(),
  is_paid: boolean("is_paid").default(false).notNull(),
  creator: text("creator").notNull(),
  status: text("status").default("active").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const deployedGroups = pgTable("deployed_groups", {
  id: integer("id").primaryKey().notNull(),
  group_id: integer("group_id").unique().notNull(),
  deployed_address: text("deployed_address").unique().notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  deployment_block: integer("deployment_block").notNull(),
  deployment_timestamp: bigint("deployment_timestamp", { mode: "number" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const groupMembers = pgTable("group_members", {
  id: integer("id").primaryKey().notNull(),
  group_id: integer("group_id").notNull(),
  member_address: text("member_address").notNull(),
  percentage: integer("percentage").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const tokenTransfers = pgTable("token_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  group_id: integer("group_id").notNull(),
  deployed_address: text("deployed_address").notNull(),
  token_address: text("token_address").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  from_address: text("from_address").notNull(),
  transaction_hash: text("transaction_hash").notNull(),
  block_number: integer("block_number").notNull(),
  block_timestamp: bigint("block_timestamp", { mode: "number" }).notNull(),
  is_processed: boolean("is_processed").default(false).notNull(),
  payment_tx_hash: text("payment_tx_hash"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
