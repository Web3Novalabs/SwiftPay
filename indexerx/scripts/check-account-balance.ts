import { RpcProvider } from "starknet";
import dotenv from "dotenv";

dotenv.config();

async function checkAccountBalance() {
  console.log("💰 Checking Account Balance");
  console.log("============================");

  try {
    // Initialize provider
    const provider = new RpcProvider({ 
      nodeUrl: "https://starknet-sepolia.public.blastapi.io" 
    });
    
    // Account address
    const accountAddress = "0x0031279d531a78a86a325bdb0856e81d02300d4b7c23ecd97afcd540057b4aea";
    
    console.log(`📋 Account Address: ${accountAddress}`);
    
    // Check if the account exists and get its info
    try {
      // Try to get the account class hash
      const classHash = await provider.getClassHashAt(accountAddress);
      console.log(`🏗️ Account Class Hash: ${classHash}`);
      
      if (classHash === "0x0") {
        console.log("⚠️ Account not deployed yet - needs deployment");
      } else {
        console.log("✅ Account is deployed");
      }
    } catch (error) {
      console.log("⚠️ Account not deployed yet - needs deployment");
    }
    
    // Check STRK balance (Sepolia STRK token address)
    const strkTokenAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
    
    try {
      // Call the STRK token contract to get balance
      const strkBalance = await provider.callContract({
        contractAddress: strkTokenAddress,
        entrypoint: "balanceOf",
        calldata: [accountAddress]
      });
      
      if (strkBalance && strkBalance.length > 0) {
        const balance = BigInt(strkBalance[0]);
        console.log(`🪙 STRK Balance: ${balance}`);
        
        // Convert to human readable (assuming 18 decimals)
        const humanBalance = Number(balance) / Math.pow(10, 18);
        console.log(`💎 STRK Balance (human): ${humanBalance.toFixed(6)} STRK`);
      } else {
        console.log("❌ Could not get STRK balance");
      }
    } catch (error) {
      console.log("❌ Error getting STRK balance:", error);
    }
    
    // Check ETH balance (Sepolia ETH token address)
    const ethTokenAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    
    try {
      const ethBalance = await provider.callContract({
        contractAddress: ethTokenAddress,
        entrypoint: "balanceOf",
        calldata: [accountAddress]
      });
      
      if (ethBalance && ethBalance.length > 0) {
        const balance = BigInt(ethBalance[0]);
        console.log(`🔷 ETH Balance: ${balance}`);
        
        // Convert to human readable (assuming 18 decimals)
        const humanBalance = Number(balance) / Math.pow(10, 18);
        console.log(`💎 ETH Balance (human): ${humanBalance.toFixed(6)} ETH`);
      } else {
        console.log("❌ Could not get ETH balance");
      }
    } catch (error) {
      console.log("❌ Error getting ETH balance:", error);
    }
    
    console.log("\n📋 Summary:");
    console.log("- STRK tokens are used for staking and some operations");
    console.log("- ETH tokens are needed for gas fees");
    console.log("- Account deployment requires ETH for gas");
    
  } catch (error) {
    console.error("❌ Failed to check account balance:", error);
  }
}

// Run the check
checkAccountBalance().catch(console.error); 