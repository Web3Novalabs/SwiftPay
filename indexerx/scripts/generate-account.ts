import { ec } from "starknet";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateAccount() {
  console.log("🔑 Generating New Starknet Account");
  console.log("==================================");

  try {
    // Generate new keypair
    const privateKey = ec.starkCurve.utils.randomPrivateKey();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    
    // Convert to hex format
    const privateKeyHex = `0x${privateKey.toString(16)}`;
    const publicKeyHex = `0x${publicKey.toString(16)}`;
    
    console.log("✅ New account generated successfully!");
    console.log(`🔐 Private Key: ${privateKeyHex}`);
    console.log(`🔑 Public Key: ${publicKeyHex}`);
    console.log(`📝 Account Address: ${publicKeyHex}`);
    
    // Save to file (be careful with this!)
    const accountData = {
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
      address: publicKeyHex,
      generatedAt: new Date().toISOString()
    };
    
    const outputPath = path.join(__dirname, "../generated-account.json");
    fs.writeFileSync(outputPath, JSON.stringify(accountData, null, 2));
    
    console.log(`\n💾 Account details saved to: ${outputPath}`);
    console.log("⚠️  IMPORTANT: Keep this file secure and never share the private key!");
    
    // Instructions for next steps
    console.log("\n📋 Next Steps:");
    console.log("1. Fund this account with some test ETH/STRK");
    console.log("2. Deploy the account contract");
    console.log("3. Update your .env file with the new keys");
    
  } catch (error) {
    console.error("❌ Failed to generate account:", error);
  }
}

// Run the generator
generateAccount().catch(console.error); 