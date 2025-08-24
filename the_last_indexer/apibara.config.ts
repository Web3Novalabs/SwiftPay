import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    paymeshStarknet: {
      startingBlock: 1849184,
      streamUrl: "https://mainnet.starknet.a5a.ch",
      contractAddress:
        "",
    },
  },
});