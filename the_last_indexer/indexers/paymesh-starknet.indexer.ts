import { defineIndexer } from "apibara/indexer";
import { useLogger } from "apibara/plugins";

import { StarknetStream, getSelector } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { startingBlock, streamUrl } = runtimeConfig["paymeshStarknet"];

  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    filter: {
      events: [
        {
          address: "0x02cc3107900daff156c0888eccbcd901500f9bf440ab694e1eecc14f4641d1dc",
          keys: [getSelector("GroupCreated")],
        },
        // {
        //   address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
        //   keys: [getSelector("Transfer")]
        // }
      ],
    },
    debug: true,
    plugins: [],

    // The transform function called for each block received from the DNA stream.
    async transform({ block, finality }) {
      const logger = useLogger();
      const { events: blockEvents, header } = block;

      if (!header) return;
      
      // logger.log(`Processing block ${header.blockNumber}`);

      for (const event of blockEvents) {
        try {
          let eventKey = event.keys[0];
          if (eventKey === getSelector("GroupCreated")) {
            console.log("✅ Processing GroupCreated event");
            const groupAddress = event.keys[1];
            console.log("🔍 Parsed GroupCreated event - group_address from keys[1]:", groupAddress);      
          }
          // else if (eventKey === getSelector("Transfer")) {
          //   // console.log("✅ A transfer occured on the starknet blockchain");
          //   const address_to = event.keys[1];
          //   // if (address_to == "0x06cbcd340c30ffa75dc7d8b716aa0f40d23a0d6eacd59a5c3c9a12e7371a6b9b") {
          //     console.log(`🎯 ERC20 Transfer to address: ${address_to}`);
          //     console.log("moeny has been sent tot he child address");
          //   // }
          // }
        } catch (error) {
          console.error("❌ Error processing event:", error);
        }
      }

    },
  });
}
