#!/usr/bin/env tsx

import postgres from "postgres";

// Database setup script for AutoShare indexer
async function setupDatabase() {
  const connectionString = process.env.POSTGRES_CONNECTION_STRING;
  
  if (!connectionString) {
    console.log("No POSTGRES_CONNECTION_STRING provided, using PGLite for local development");
    return;
  }

  try {
    // Create database connection
    const client = postgres(connectionString);

    console.log("Connected to PostgreSQL database");

    // Create indexes for better performance
    console.log("Creating database indexes...");
    
    // Groups table indexes
    await client`CREATE INDEX IF NOT EXISTS idx_groups_group_id ON groups(group_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator)`;
    await client`CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status)`;
    await client`CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at)`;

    // Group members indexes
    await client`CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_group_members_address ON group_members(member_address)`;

    // Group addresses indexes
    await client`CREATE INDEX IF NOT EXISTS idx_group_addresses_group_id ON group_addresses(group_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_group_addresses_child_address ON group_addresses(child_contract_address)`;

    // Update requests indexes
    await client`CREATE INDEX IF NOT EXISTS idx_update_requests_group_id ON update_requests(group_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_update_requests_requester ON update_requests(requester)`;
    await client`CREATE INDEX IF NOT EXISTS idx_update_requests_completed ON update_requests(is_completed)`;

    // Events indexes
    await client`CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`;
    await client`CREATE INDEX IF NOT EXISTS idx_events_block_number ON events(block_number)`;
    await client`CREATE INDEX IF NOT EXISTS idx_events_transaction_hash ON events(transaction_hash)`;

    // Group payments indexes
    await client`CREATE INDEX IF NOT EXISTS idx_group_payments_group_id ON group_payments(group_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_group_payments_paid_by ON group_payments(paid_by)`;
    await client`CREATE INDEX IF NOT EXISTS idx_group_payments_paid_at ON group_payments(paid_at)`;

    console.log("Database indexes created successfully");

    // Insert initial contract state using raw SQL
    console.log("Initializing contract state...");
    
    await client`
      INSERT INTO contract_state (key, value) VALUES 
        ('group_count', '0'),
        ('update_request_count', '0'),
        ('indexer_version', '1.0.0'),
        ('last_updated', NOW()::text)
      ON CONFLICT (key) DO NOTHING;
    `;

    console.log("Contract state initialized");

    // Close connection
    await client.end();
    console.log("Database setup completed successfully");

  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase }; 