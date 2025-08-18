#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { deployedGroups, tokenTransfers } from "../lib/schema";

// Database connection
const connectionString = "postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer";
const client = postgres(connectionString);
const db = drizzle(client);

async function testERC20Simulation() {
  console.log("🧪 Testing ERC20 Transfer Event Simulation\n");

  try {
    // 1. Check our current deployed groups
    console.log("1️⃣ Current deployed groups:");
    const groups = await db.select().from(deployedGroups);
    groups.forEach(group => {
      console.log(`  - Group ${group.group_id}: ${group.deployed_address}`);
    });
    console.log();

    // 2. Simulate an ERC20 transfer event structure
    console.log("2️⃣ Simulating ERC20 Transfer event structure:");
    const simulatedEvent = {
      address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", // STRK token contract
      keys: [
        "0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108c12e6198e9c", // ERC20 Transfer selector
        "0x0000000000000000000000000000000000000000000000000000000000000000"  // Additional key
      ],
      data: [
        "0x00294f06f53fd2a9a199a50777a39aa6e8159ba1e1fcee679a5f4a0d583049fa", // from address
        "0x04669fb35b275cecbf33958733136d743921136efc0d1b7076fb8f864fe336ce", // to address (Group 96)
        "0x0000000000000000000000000000000000000000000000000000000000000005"  // amount (5 tokens)
      ],
      transactionHash: "0x" + Math.random().toString(16).substring(2, 66),
      blockNumber: 1537800,
      timestamp: Date.now()
    };

    console.log("Simulated event:");
    console.log(`  Token Contract: ${simulatedEvent.address}`);
    console.log(`  Event Selector: ${simulatedEvent.keys[0]}`);
    console.log(`  From: ${simulatedEvent.data[0]}`);
    console.log(`  To: ${simulatedEvent.data[1]}`);
    console.log(`  Amount: ${simulatedEvent.data[2]}`);
    console.log();

    // 3. Test our event detection logic
    console.log("3️⃣ Testing event detection logic:");
    
    // Check if this looks like a Transfer event
    const eventKeyString = simulatedEvent.keys[0];
    const dataLength = simulatedEvent.data.length;
    
    console.log(`Event key: ${eventKeyString}`);
    console.log(`Data length: ${dataLength}`);
    
    if (dataLength === 3) {
      console.log("✅ Event has 3 parameters (from, to, amount)");
      
      // Check if addresses look like valid Starknet addresses
      const fromAddress = simulatedEvent.data[0];
      const toAddress = simulatedEvent.data[1];
      
      if (typeof fromAddress === 'string' && typeof toAddress === 'string' && 
          fromAddress.startsWith('0x') && toAddress.startsWith('0x') &&
          fromAddress.length === 66 && toAddress.length === 66) {
        console.log("✅ Addresses look like valid Starknet addresses");
        
        // Check if recipient is a deployed group
        const targetGroup = groups.find(g => g.deployed_address === toAddress);
        if (targetGroup) {
          console.log(`✅ Recipient is a deployed group! (Group ${targetGroup.group_id})`);
          console.log(`   This transfer should trigger automatic payment!`);
        } else {
          console.log("❌ Recipient is NOT a deployed group");
        }
      } else {
        console.log("❌ Addresses don't look like valid Starknet addresses");
      }
    } else {
      console.log("❌ Event doesn't have 3 parameters");
    }
    console.log();

    // 4. Test database insertion
    console.log("4️⃣ Testing database insertion:");
    try {
      const newTransfer = await db.insert(tokenTransfers).values({
        group_id: 96, // Group 96
        deployed_address: "0x04669fb35b275cecbf33958733136d743921136efc0d1b7076fb8f864fe336ce",
        token_address: simulatedEvent.address,
        amount: 5,
        from_address: simulatedEvent.data[0],
        transaction_hash: simulatedEvent.transactionHash,
        block_number: simulatedEvent.blockNumber,
        block_timestamp: simulatedEvent.timestamp,
        is_processed: false,
      }).returning();
      
      console.log("✅ Token transfer inserted successfully!");
      console.log(`   Transfer ID: ${newTransfer[0].id}`);
      console.log(`   Group: 96`);
      console.log(`   Amount: 5 tokens`);
    } catch (error) {
      console.log("❌ Failed to insert token transfer:", error);
    }
    console.log();

    // 5. Verify the transfer was stored
    console.log("5️⃣ Verifying stored transfer:");
    const transfers = await db.select().from(tokenTransfers);
    console.log(`Total token transfers: ${transfers.length}`);
    transfers.forEach(transfer => {
      console.log(`  - ${transfer.from_address} → ${transfer.deployed_address}: ${transfer.amount} tokens`);
      console.log(`    Processed: ${transfer.is_processed ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.end();
  }
}

// Run the test
testERC20Simulation().catch(console.error); 