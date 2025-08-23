import { defineConfig } from "apibara/config";

export default defineConfig({
  runtimeConfig: {
    paymeshStarknet: {
      startingBlock: 900_000,
      streamUrl: "https://sepolia.starknet.a5a.ch",
      contractAddress:
        "0x03eb5cc3d473d59331c48096cafa360d52b49fcd6a08b14a6811223c773a2d73",
    },
  },
});