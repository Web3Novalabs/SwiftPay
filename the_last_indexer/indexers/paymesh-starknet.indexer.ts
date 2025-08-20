import { defineIndexer } from "apibara/indexer";
import { useLogger } from "apibara/plugins";

import { StarknetStream, getSelector, FieldElement } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { startingBlock, streamUrl } = runtimeConfig["paymeshStarknet"];

  const TRANSFER_SELECTOR = getSelector("Transfer");
  const GROUP_CREATED_SELECTOR = getSelector("GroupCreated");

  let group_addresses: FieldElement[] = [];

  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(1624892),
    filter: {
      events: [
        {
          address: "0x02cc3107900daff156c0888eccbcd901500f9bf440ab694e1eecc14f4641d1dc",
          keys: [GROUP_CREATED_SELECTOR],
        },
        {
          address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
          keys: [TRANSFER_SELECTOR]
        },
      ],
    },
    plugins: [],
    async transform({ block }) {
      const logger = useLogger();
      const { events: blockEvents, header } = block;
      if (!header) return;

      if (header && header.blockNumber !== undefined) {
        logger.info(`Processing block number: ${header.blockNumber}`);
      }
      
      for (const event of blockEvents) {
        let eventKey = event.keys[0];
        if (eventKey === GROUP_CREATED_SELECTOR) {
            logger.info("✅ Processing GroupCreated event");
            const groupAddress = event.keys[1];
            logger.info(`🔍 Parsed GroupCreated event - group_address from keys[1]: ${groupAddress}`);
            group_addresses.push(groupAddress);
            logger.info(`Current group_addresses array: ${JSON.stringify(group_addresses)}`);
        } 
        else if (eventKey === TRANSFER_SELECTOR) {
          const [, to, , ] = event.data;
          if (group_addresses.includes(to)) {
              logger.info(`Current group_addresses array when transferring: ${JSON.stringify(group_addresses)}`);
              console.log("🎯 transaction found (to is in our contract addresses)");
              console.log("Event Data: \n", event.data);
          }
        }
      }

    },
  });
}
