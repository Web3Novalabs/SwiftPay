import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    paymeshStarknet: {
      startingBlock: 1848993,
      streamUrl: "https://mainnet.starknet.a5a.ch",
      contractAddress:
        "",
    },
  },
});