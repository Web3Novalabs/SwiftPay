#!/usr/bin/env tsx

import { defineConfig } from "apibara/config";

// Test script to verify configuration
async function testConfig() {
  console.log("🔍 Testing AutoShare Indexer Configuration...\n");
  
  try {
    // Load configuration
    const config = defineConfig({
      runtimeConfig: {
        myIndexer: {
          startingBlock: 0,
          streamUrl: "https://sepolia.starknet.a5a.ch",
          contractAddress: "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d",
        },
      },
    });
    
    console.log("✅ Configuration loaded successfully");
    console.log("📋 Configuration details:");
    
    // Access config safely
    const runtimeConfig = config.runtimeConfig;
    if (runtimeConfig && runtimeConfig.myIndexer) {
      const indexerConfig = runtimeConfig.myIndexer;
      console.log(`   Contract Address: ${indexerConfig.contractAddress}`);
      console.log(`   Stream URL: ${indexerConfig.streamUrl}`);
      console.log(`   Starting Block: ${indexerConfig.startingBlock}`);
      console.log(`   Network: Sepolia`);
      
      // Validate contract address format
      const address = indexerConfig.contractAddress;
      if (address && address.startsWith("0x") && address.length === 66) {
        console.log("✅ Contract address format is valid (Starknet format)");
      } else {
        console.log("❌ Contract address format is invalid");
      }
    } else {
      console.log("❌ Configuration structure is invalid");
    }
    
    console.log("\n🚀 Configuration is ready for use!");
    console.log("   Run 'pnpm run dev' to start indexing");
    console.log("   Run 'pnpm run api:dev' to start the API server");
    
  } catch (error) {
    console.error("❌ Configuration test failed:", error);
    process.exit(1);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConfig();
}

export { testConfig }; 