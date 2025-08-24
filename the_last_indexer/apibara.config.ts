import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    paymeshStarknet: {
      startingBlock: 1679531,
      streamUrl: "https://mainnet.starknet.a5a.ch",
      contractAddress:
        "",
    },
  },
});