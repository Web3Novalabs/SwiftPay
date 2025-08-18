#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ContractUtils } from "../lib/contract-utils";
import { deployedGroups, tokenTransfers, groups } from "../lib/schema";
import { eq } from "drizzle-orm";

// Test configuration
const TEST_CONFIG = {
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/indexerx",
  testGroupId: 1,
  testGroupAddress: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  testTokenAddress: "0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
  testAmount: BigInt("1000000000000000000"), // 1 token with 18 decimals
};

async function testDatabaseConnection() {
  console.log("🔌 Testing database connection...");
  
  try {
    const client = postgres(TEST_CONFIG.databaseUrl);
    const db = drizzle(client);
    
    console.log("✅ Database connection successful");
    return { client, db };
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

async function testDeployedGroupsTable(db: any) {
  console.log("\n📋 Testing deployed groups table...");
  
  try {
    // Test inserting a deployed group
    const testGroup = {
      group_id: TEST_CONFIG.testGroupId,
      deployed_address: TEST_CONFIG.testGroupAddress,
      is_active: true,
      deployment_block: 12345,
      deployment_timestamp: Date.now(),
    };
    
    await db.insert(deployedGroups).values(testGroup);
    console.log("✅ Inserted test deployed group");
    
    // Test querying the deployed group
    const result = await ContractUtils.getDeployedGroupByAddress(db, TEST_CONFIG.testGroupAddress);
    
    if (result) {
      console.log("✅ Successfully queried deployed group:", {
        groupId: result.group_id,
        address: result.deployed_address,
        isActive: result.is_active,
      });
    } else {
      console.log("⚠️ Deployed group not found after insertion");
    }
    
    // Test checking if address is a deployed group
    const isDeployed = await ContractUtils.isDeployedGroupAddress(db, TEST_CONFIG.testGroupAddress);
    console.log(`✅ Address is deployed group: ${isDeployed}`);
    
    return true;
  } catch (error) {
    console.error("❌ Error testing deployed groups table:", error);
    return false;
  }
}

async function testTokenTransfersTable(db: any) {
  console.log("\n🪙 Testing token transfers table...");
  
  try {
    // Test inserting a token transfer
    const testTransfer = {
      group_id: TEST_CONFIG.testGroupId,
      deployed_address: TEST_CONFIG.testGroupAddress,
      token_address: TEST_CONFIG.testTokenAddress,
      amount: Number(TEST_CONFIG.testAmount),
      from_address: "0x1111111111111111111111111111111111111111111111111111111111111111",
      transaction_hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      block_number: 12346,
      block_timestamp: Date.now(),
      is_processed: false,
    };
    
    await db.insert(tokenTransfers).values(testTransfer);
    console.log("✅ Inserted test token transfer");
    
    // Test marking transfer as processed
    await ContractUtils.markTokenTransferProcessed(
      db,
      testTransfer.transaction_hash,
      "0x3333333333333333333333333333333333333333333333333333333333333333"
    );
    console.log("✅ Marked token transfer as processed");
    
    return true;
  } catch (error) {
    console.error("❌ Error testing token transfers table:", error);
    return false;
  }
}

async function testPaymentTriggering(db: any) {
  console.log("\n💸 Testing payment triggering...");
  
  try {
    // Test the payment trigger function
    const result = await ContractUtils.triggerGroupPayment(
      db,
      TEST_CONFIG.testGroupId,
      TEST_CONFIG.testGroupAddress,
      TEST_CONFIG.testTokenAddress,
      TEST_CONFIG.testAmount
    );
    
    if (result.success) {
      console.log("✅ Payment trigger successful");
      console.log(`📝 Transaction hash: ${result.transactionHash}`);
    } else {
      console.log("⚠️ Payment trigger failed:", result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error("❌ Error testing payment triggering:", error);
    return false;
  }
}

async function cleanupTestData(db: any, client: any) {
  console.log("\n🧹 Cleaning up test data...");
  
  try {
    // Remove test data
    await db.delete(tokenTransfers).where(eq(tokenTransfers.group_id, TEST_CONFIG.testGroupId));
    await db.delete(deployedGroups).where(eq(deployedGroups.group_id, TEST_CONFIG.testGroupId));
    
    console.log("✅ Test data cleaned up");
  } catch (error) {
    console.error("⚠️ Error cleaning up test data:", error);
  } finally {
    await client.end();
  }
}

async function runTests() {
  console.log("🚀 Starting implementation tests...\n");
  
  let client: any = null;
  let db: any = null;
  
  try {
    // Test database connection
    const connection = await testDatabaseConnection();
    client = connection.client;
    db = connection.db;
    
    // Test deployed groups functionality
    const deployedGroupsTest = await testDeployedGroupsTable(db);
    
    // Test token transfers functionality
    const tokenTransfersTest = await testTokenTransfersTable(db);
    
    // Test payment triggering functionality
    const paymentTriggerTest = await testPaymentTriggering(db);
    
    // Summary
    console.log("\n📊 Test Results Summary:");
    console.log(`  Database Connection: ${connection ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  Deployed Groups: ${deployedGroupsTest ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  Token Transfers: ${tokenTransfersTest ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  Payment Triggering: ${paymentTriggerTest ? "✅ PASS" : "❌ FAIL"}`);
    
    const allTestsPassed = deployedGroupsTest && tokenTransfersTest && paymentTriggerTest;
    
    if (allTestsPassed) {
      console.log("\n🎉 All tests passed! Implementation is working correctly.");
    } else {
      console.log("\n⚠️ Some tests failed. Check the logs above for details.");
    }
    
  } catch (error) {
    console.error("\n💥 Test suite failed with error:", error);
  } finally {
    if (client) {
      await cleanupTestData(db, client);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
} 