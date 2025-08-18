import { RpcProvider, Account, ec } from "starknet";
import dotenv from "dotenv";

dotenv.config();

async function deployAccount() {
  console.log("🚀 Deploying Starknet Account Contract");
  console.log("======================================");

  try {
    // Initialize provider
    const provider = new RpcProvider({ 
      nodeUrl: "https://starknet-sepolia.public.blastapi.io" 
    });
    
    // Account details (replace with your generated account)
    const privateKeyString = "0x410447219162140332428182271051083621517261751921911968910021419115801472521157219";
    const accountAddress = "0x3e6a55cda01e831d102c09c011da0ee42bf1792b5d1734c6360e184d530a4f7";
    
    // Convert private key to proper format
    const privateKey = privateKeyString.replace('0x', '');
    
    console.log(`📋 Account Address: ${accountAddress}`);
    console.log(`🔐 Private Key: ${privateKeyString.substring(0, 20)}...`);
    
    console.log("\n⚠️  Note: Account balance check skipped (not available on RpcProvider)");
    console.log("💡 Make sure your account is funded before deployment");
    
    // Deploy account contract
    console.log("\n🔧 Deploying account contract...");
    
    const account = new Account(provider, accountAddress, privateKey, "1");
    
    // Deploy the account with correct parameters
    const deployResult = await account.deployAccount({
      classHash: "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2", // OpenZeppelin account class for Sepolia
      constructorCalldata: [] // OpenZeppelin accounts don't need constructor calldata
    });
    
    console.log("✅ Account deployed successfully!");
    console.log(`🔗 Transaction Hash: ${deployResult.transaction_hash}`);
    console.log(`📝 Contract Address: ${deployResult.contract_address}`);
    
    console.log("\n📋 Next Steps:");
    console.log("1. Wait for deployment to be confirmed");
    console.log("2. Update your .env file with the new account details");
    console.log("3. Test the account with a simple transaction");
    
  } catch (error) {
    console.error("❌ Failed to deploy account:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("insufficient balance")) {
        console.log("\n💡 Solution: Fund your account with test tokens first");
        console.log("🌐 Visit: https://faucet.goerli.starknet.io/");
      }
    }
  }
}

// Run the deployment
deployAccount().catch(console.error); 