import fetch from "node-fetch";

async function testRpcEndpoints() {
  console.log("🧪 Testing RPC Endpoints Directly");
  console.log("==================================");

  const endpoints = [
    "https://alpha-sepolia.starknet.io",
    "https://sepolia.starknet.io",
    "https://starknet-sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    "https://starknet-sepolia.public.blastapi.io"
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'starknet_getBlockNumber',
          params: [],
          id: 1
        })
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`Response: ${data.substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        console.log(`Error response: ${errorText}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed:`, error);
    }
  }
}

// Run the test
testRpcEndpoints().catch(console.error); 