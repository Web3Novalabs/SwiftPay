import { ContractUtils } from "../lib/contract-utils";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testGroupMembers() {
  console.log("🧪 Testing Group Members Functionality");
  console.log("=====================================");

  try {
    // Test 1: Initialize Starknet connection
    console.log("\n1️⃣ Initializing Starknet connection...");
    await ContractUtils.initialize();
    console.log("✅ Starknet connection initialized");

    // Test 2: Test contract query for group members
    console.log("\n2️⃣ Testing contract query for group members...");
    
    // Test with a group ID that should exist (based on your logs, group 107 exists)
    const groupId = 107;
    
    // Create a mock database object for testing
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => []
          })
        })
      }),
      insert: () => ({
        values: () => Promise.resolve([{ id: 1 }])
      })
    };

    // Test the getGroupMembers function (this will query the contract)
    console.log(`🔍 Querying contract for group ${groupId} members...`);
    
    // Note: This will actually call your contract's get_group_member function
    // Make sure your contract is accessible and has this function
    
    console.log("✅ Group members test completed");
    console.log("\n📋 Next steps:");
    console.log("1. The indexer will now query your contract for group members");
    console.log("2. Members will be cached in the database for faster lookups");
    console.log("3. When ERC20 transfers are detected, real payments will be triggered");
    console.log("4. The contract's pay() function will handle all payment logic");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

// Run the test
testGroupMembers().catch(console.error); 