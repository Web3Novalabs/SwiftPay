import { RpcProvider, Account, ec } from "starknet";
import dotenv from "dotenv";

dotenv.config();

async function testContractFunctions() {
  console.log("🧪 Testing Contract Functions Discovery");
  console.log("======================================");

  try {
    // Initialize provider
    const provider = new RpcProvider({ 
      nodeUrl: "https://starknet-sepolia.public.blastapi.io" 
    });
    
    const contractAddress = process.env.MAIN_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("MAIN_CONTRACT_ADDRESS not found in environment");
    }
    
    console.log(`📋 Contract: ${contractAddress}`);
    
    // Try to get contract class info
    try {
      const classHash = await provider.getClassHashAt(contractAddress);
      console.log(`🏗️ Contract class hash: ${classHash}`);
      
      const contractClass = await provider.getClass(classHash);
      console.log(`📜 Contract class:`, contractClass);
      
      if (contractClass.abi) {
        console.log("\n🔍 Available functions:");
        contractClass.abi.forEach((item: any) => {
          if (item.type === 'function') {
            console.log(`  📝 ${item.name}(${item.inputs?.map((i: any) => i.type).join(', ') || 'none'}) -> ${item.outputs?.map((o: any) => o.type).join(', ') || 'void'}`);
          }
        });
      }
      
    } catch (error) {
      console.log("❌ Could not get contract class:", error);
    }
    
    // Try different function names that might exist
    const possibleFunctions = [
      "get_group_member",
      "get_group_members", 
      "get_group",
      "get_members",
      "members"
    ];
    
    for (const funcName of possibleFunctions) {
      console.log(`\n🔍 Testing function: ${funcName}`);
      
      try {
        // Try with simple parameter
        const result = await provider.callContract({
          contractAddress,
          entrypoint: funcName,
          calldata: ["0x1"] // group ID 1
        });
        
        console.log(`✅ ${funcName} successful:`, result);
        break;
        
      } catch (error) {
        console.log(`❌ ${funcName} failed:`, error instanceof Error ? error.message : error);
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testContractFunctions().catch(console.error); 