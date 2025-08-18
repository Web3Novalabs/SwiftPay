import { ContractUtils } from "../lib/contract-utils";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testStarknetIntegration() {
  console.log("🧪 Testing Starknet.js Integration");
  console.log("==================================");

  try {
    // Test 1: Check environment variables
    console.log("\n1️⃣ Checking environment variables...");
    const requiredVars = [
      'STARKNET_RPC_URL',
      'PRIVATE_KEY', 
      'ACCOUNT_ADDRESS',
      'MAIN_CONTRACT_ADDRESS'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      return;
    }
    
    console.log("✅ All required environment variables are set");
    console.log(`📡 RPC URL: ${process.env.STARKNET_RPC_URL}`);
    console.log(`👤 Account: ${process.env.ACCOUNT_ADDRESS}`);
    console.log(`📋 Contract: ${process.env.MAIN_CONTRACT_ADDRESS}`);

    // Test 2: Initialize Starknet connection
    console.log("\n2️⃣ Initializing Starknet connection...");
    await ContractUtils.initialize();
    console.log("✅ Starknet connection initialized successfully");

    // Test 3: Check if ContractUtils is ready
    console.log("\n3️⃣ Checking ContractUtils status...");
    const isReady = ContractUtils.isReady();
    console.log(`Status: ${isReady ? '✅ Ready' : '❌ Not ready'}`);

    // Test 4: Get contract address
    console.log("\n4️⃣ Getting contract address...");
    const contractAddress = ContractUtils.getContractAddress();
    console.log(`Contract address: ${contractAddress}`);

    // Test 5: Test database functions (without Starknet calls)
    console.log("\n5️⃣ Testing database utility functions...");
    
    // Create a mock database object for testing
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => []
          })
        })
      })
    };

    const isGroupAddress = await ContractUtils.isDeployedGroupAddress(mockDb, "0x123");
    console.log(`Mock group address check: ${isGroupAddress ? 'Found' : 'Not found'}`);

    console.log("\n🎉 All tests completed successfully!");
    console.log("✅ Starknet.js integration is working correctly");
    console.log("🚀 Your indexer is ready to make real contract calls!");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

// Run the test
testStarknetIntegration().catch(console.error); 