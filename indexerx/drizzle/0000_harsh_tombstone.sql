CREATE TYPE "public"."group_status" AS ENUM('active', 'paid', 'updating');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contract_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "contract_state_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cursor_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"end_cursor" bigint,
	"unique_key" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"group_id" bigint,
	"transaction_hash" text NOT NULL,
	"block_number" bigint NOT NULL,
	"block_timestamp" bigint,
	"event_data" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"child_contract_address" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "group_addresses_group_id_unique" UNIQUE("group_id"),
	CONSTRAINT "group_addresses_child_contract_address_unique" UNIQUE("child_contract_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"member_address" text NOT NULL,
	"percentage" integer NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"paid_by" text NOT NULL,
	"paid_at" bigint NOT NULL,
	"transaction_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"name" text NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"creator" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"status" "group_status" DEFAULT 'active',
	CONSTRAINT "groups_group_id_unique" UNIQUE("group_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pending_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"has_pending_update" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pending_updates_group_id_unique" UNIQUE("group_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "update_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"member_address" text NOT NULL,
	"has_approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "update_request_new_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"member_address" text NOT NULL,
	"percentage" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "update_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"new_name" text NOT NULL,
	"requester" text NOT NULL,
	"fee_paid" boolean DEFAULT false NOT NULL,
	"approval_count" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "update_requests_group_id_unique" UNIQUE("group_id")
);
