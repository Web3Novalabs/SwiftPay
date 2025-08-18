import { ContractUtils } from "../lib/contract-utils";
import dotenv from "dotenv";

dotenv.config();

async function testPayment() {
  console.log("🧪 Testing Payment Functionality");
  console.log("=================================");

  try {
    // Initialize Starknet connection
    console.log("1️⃣ Initializing Starknet connection...");
    await ContractUtils.initialize();
    console.log("✅ Starknet connection initialized");

    // Test payment triggering
    console.log("\n2️⃣ Testing payment trigger...");
    
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
    
    // Test with a known group
    const groupId = 107;
    const groupAddress = "0x001bf906fdb514c3b6313dbf5e4f5f736e135ef474c150da1c39394cb893a7ea";
    const tokenAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
    const amount = "0x00000000000000000000000000000000000000000000000002c68af0bb140000";
    
    console.log(`🔍 Testing payment for group ${groupId}`);
    console.log(`📍 Group address: ${groupAddress}`);
    console.log(`🪙 Token: ${tokenAddress}`);
    console.log(`💎 Amount: ${amount}`);
    
    // Try to trigger the payment
    const result = await ContractUtils.triggerGroupPayment(
      mockDb,
      groupId,
      groupAddress,
      tokenAddress,
      amount,
      "test-tx-hash"
    );
    
    if (result.success) {
      console.log("✅ Payment triggered successfully!");
      console.log("Transaction hash:", result.transactionHash);
    } else {
      console.log("❌ Payment failed:", result.error);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testPayment().catch(console.error); 