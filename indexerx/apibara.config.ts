import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    // Default configuration
    startingBlock: 0,
    streamUrl: "https://sepolia.starknet.a5a.ch",
    contractAddress: "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d",
    
    myIndexer: {
      startingBlock: 0,
      streamUrl: "https://sepolia.starknet.a5a.ch",
      contractAddress: "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d",
    },
  },
  
  presets: {
    sepolia: {
      runtimeConfig: {
        startingBlock: 0,
        streamUrl: "https://sepolia.starknet.a5a.ch",
        contractAddress: "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d",
      },
    },
    mainnet: {
      runtimeConfig: {
        startingBlock: 0,
        streamUrl: "https://mainnet.starknet.a5a.ch",
        contractAddress: "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d",
      },
    },
    testnet: {
      runtimeConfig: {
        startingBlock: 0,
        streamUrl: "https://testnet.starknet.a5a.ch",
        contractAddress: "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d",
      },
    },
  },
});
