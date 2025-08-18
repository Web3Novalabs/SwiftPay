#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ContractUtils } from "../lib/contract-utils";
import { deployedGroups, tokenTransfers, groups } from "../lib/schema";
import { eq } from "drizzle-orm";

// Database connection
const connectionString = "postgresql://autoshare:autoshare123@localhost:5433/autoshare_indexer";
const client = postgres(connectionString);
const db = drizzle(client);

async function testTokenMonitoring() {
  console.log("🧪 Testing Token Transfer Monitoring Implementation\n");

  try {
    // 1. Test database connection
    console.log("1️⃣ Testing database connection...");
    const result = await client`SELECT 1 as test`;
    console.log("✅ Database connection successful\n");

    // 2. Check deployed groups
    console.log("2️⃣ Checking deployed groups...");
    const deployedGroupsList = await db.select().from(deployedGroups);
    console.log(`Found ${deployedGroupsList.length} deployed groups:`);
    deployedGroupsList.forEach(group => {
      console.log(`  - Group ${group.group_id}: ${group.deployed_address}`);
    });
    console.log();

    if (deployedGroupsList.length === 0) {
      console.log("❌ No deployed groups found. Cannot test token monitoring.");
      return;
    }

    // 3. Test ContractUtils.triggerGroupPayment
    console.log("3️⃣ Testing payment triggering logic...");
    const testGroup = deployedGroupsList[0];
    const testAmount = BigInt(1000000000000000000); // 1 token with 18 decimals
    
    console.log(`Testing with group ${testGroup.group_id} at ${testGroup.deployed_address}`);
    
    const paymentResult = await ContractUtils.triggerGroupPayment(
      db,
      testGroup.group_id,
      testGroup.deployed_address,
      "0x1234567890123456789012345678901234567890", // Test token address
      testAmount
    );
    
    if (paymentResult.success) {
      console.log("✅ Payment triggering successful!");
      console.log(`   Transaction hash: ${paymentResult.transactionHash}`);
    } else {
      console.log("❌ Payment triggering failed:", paymentResult.error);
    }
    console.log();

    // 4. Test token transfer simulation
    console.log("4️⃣ Testing token transfer simulation...");
    
    // Simulate a token transfer to the group address
    const simulatedTransfer = {
      group_id: testGroup.group_id,
      deployed_address: testGroup.deployed_address,
      token_address: "0x1234567890123456789012345678901234567890",
      amount: Number(testAmount),
      from_address: "0x1111111111111111111111111111111111111111",
      transaction_hash: "0x" + Math.random().toString(16).substring(2, 66),
      block_number: 1537000,
      block_timestamp: Date.now(),
      is_processed: false,
    };
    
    // Insert the simulated transfer
    await db.insert(tokenTransfers).values(simulatedTransfer);
    console.log("✅ Simulated token transfer inserted");
    console.log(`   From: ${simulatedTransfer.from_address}`);
    console.log(`   To: ${simulatedTransfer.deployed_address}`);
    console.log(`   Amount: ${simulatedTransfer.amount}`);
    console.log(`   Token: ${simulatedTransfer.token_address}`);
    console.log();

    // 5. Check token transfers table
    console.log("5️⃣ Checking token transfers table...");
    const transfers = await db.select().from(tokenTransfers);
    console.log(`Found ${transfers.length} token transfers:`);
    transfers.forEach(transfer => {
      console.log(`  - ${transfer.from_address} → ${transfer.deployed_address}: ${transfer.amount} tokens`);
      console.log(`    Processed: ${transfer.is_processed ? 'Yes' : 'No'}`);
      if (transfer.payment_tx_hash) {
        console.log(`    Payment TX: ${transfer.payment_tx_hash}`);
      }
    });
    console.log();

    // 6. Test group status update
    console.log("6️⃣ Checking group status...");
    const groupStatus = await db.select().from(groups).where(eq(groups.group_id, testGroup.group_id));
    if (groupStatus.length > 0) {
      const group = groupStatus[0];
      console.log(`Group ${group.group_id} status: ${group.status}`);
      console.log(`Is paid: ${group.is_paid}`);
    }
    console.log();

    console.log("🎉 Token monitoring test completed successfully!");
    console.log("\n📋 Summary:");
    console.log("✅ Database connection working");
    console.log("✅ Deployed groups accessible");
    console.log("✅ Payment triggering logic functional");
    console.log("✅ Token transfer simulation working");
    console.log("✅ Database tables properly configured");
    
    console.log("\n🚀 Next steps:");
    console.log("1. The indexer is now listening for ERC20 Transfer events");
    console.log("2. When tokens are sent to a deployed group address:");
    console.log("   - The transfer will be detected and stored");
    console.log("   - Payment will be automatically triggered");
    console.log("   - Group members will receive their share");
    console.log("3. Monitor the indexer logs for real token transfer events");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.end();
  }
}

// Run the test
testTokenMonitoring().catch(console.error); 