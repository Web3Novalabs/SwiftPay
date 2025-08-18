import { ContractUtils } from "../lib/contract-utils";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testContractCall() {
  console.log("🧪 Testing Contract Call");
  console.log("=========================");

  try {
    // Test 1: Initialize Starknet connection
    console.log("\n1️⃣ Initializing Starknet connection...");
    await ContractUtils.initialize();
    console.log("✅ Starknet connection initialized");

    // Test 2: Test basic provider functionality
    console.log("\n2️⃣ Testing provider functionality...");
    try {
      const blockNumber = await ContractUtils.provider.getBlockNumber();
      console.log(`✅ Latest block number: ${blockNumber}`);
    } catch (error) {
      console.error("❌ Failed to get block number:", error);
    }

    // Test 3: Test contract call
    console.log("\n3️⃣ Testing contract call...");
    try {
      // Test with a known group ID
      const groupId = 107;
      
      console.log(`🔍 Calling get_group_member for group ${groupId}...`);
      
      // Use the ContractUtils function instead of calling provider directly
      // This will use our updated calldata format logic
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
      
      const members = await ContractUtils.getGroupMembers(mockDb, groupId);
      
      if (members && members.length > 0) {
        console.log("✅ Contract call successful!");
        console.log(`Found ${members.length} members:`, members);
      } else {
        console.log("⚠️ No members found, but contract call completed without errors");
      }
      
    } catch (error) {
      console.error("❌ Contract call failed:", error);
      
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name
        });
      }
    }

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

// Run the test
testContractCall().catch(console.error); 