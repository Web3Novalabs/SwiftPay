import { ec } from "starknet";

async function generateAccount() {
  console.log("🔑 Generating New Starknet Account");
  console.log("==================================");

  try {
    // Generate new keypair
    const privateKey = ec.starkCurve.utils.randomPrivateKey();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    
    // Convert to hex format properly
    const privateKeyHex = `0x${privateKey.toString(16).replace(/,/g, '')}`;
    const publicKeyHex = `0x${publicKey.toString(16).replace(/,/g, '')}`;
    
    console.log("✅ New account generated successfully!");
    console.log(`🔐 Private Key: ${privateKeyHex}`);
    console.log(`🔑 Public Key: ${publicKeyHex}`);
    console.log(`📝 Account Address: ${publicKeyHex}`);
    
    console.log("\n📋 Next Steps:");
    console.log("1. Copy the private key and address above");
    console.log("2. Fund this account with some test ETH/STRK");
    console.log("3. Deploy the account contract");
    console.log("4. Update your .env file with the new keys");
    
    console.log("\n⚠️  IMPORTANT: Keep the private key secure and never share it!");
    
  } catch (error) {
    console.error("❌ Failed to generate account:", error);
  }
}

// Run the generator
generateAccount().catch(console.error); 