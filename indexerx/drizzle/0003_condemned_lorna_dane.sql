CREATE TABLE IF NOT EXISTS "deployed_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"deployed_address" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deployment_block" bigint NOT NULL,
	"deployment_timestamp" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "deployed_groups_group_id_unique" UNIQUE("group_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"deployed_address" text NOT NULL,
	"token_address" text NOT NULL,
	"amount" bigint NOT NULL,
	"from_address" text NOT NULL,
	"transaction_hash" text NOT NULL,
	"block_number" bigint NOT NULL,
	"block_timestamp" bigint NOT NULL,
	"is_processed" boolean DEFAULT false NOT NULL,
	"payment_tx_hash" text,
	"created_at" timestamp DEFAULT now()
);
