// import { Block } from "https://esm.sh/@apibara/indexer@0.3.1/starknet";
// import type {
//   Config,
//   NetworkOptions,
//   SinkOptions,
// } from "https://esm.sh/@apibara/indexer";
// import { startingBlock, autoSwap, logTransaction } from "./net.ts";
// import {
//   STRK_TOKEN_CONTRACT_ADDRESS,
//   STRK_TRANSFER_EVENT_KEY,
//   AUTOSWAPPR_CONTRACT_ADDRESS,
//   SWAP_SUCCESSFUL_EVENT_KEY,
//   UNSTABLE_TOKENS_ARRAY,
//   ETH_TOKEN_CONTRACT_ADDRESS,
//   ETH_TRANSFER_EVENT_KEY,
// } from "./constants.ts";

// export const config: Config<NetworkOptions, SinkOptions> = {
//   streamUrl: "https://mainnet.starknet.a5a.ch",
//   startingBlock: startingBlock,
//   network: "starknet",
//   finality: "DATA_STATUS_ACCEPTED",
//   filter: {
//     header: {
//       weak: true,
//     },
//     events: [
//       {
//         fromAddress: AUTOSWAPPR_CONTRACT_ADDRESS,
//         keys: [SWAP_SUCCESSFUL_EVENT_KEY],
//         includeReceipt: false,
//       },
//       {
//         fromAddress: STRK_TOKEN_CONTRACT_ADDRESS,
//         keys: [STRK_TRANSFER_EVENT_KEY],
//         includeReceipt: false,
//       },
//       {
//         fromAddress: ETH_TOKEN_CONTRACT_ADDRESS,
//         keys: [ETH_TRANSFER_EVENT_KEY],
//         includeReceipt: false,
//       },
//     ],
//   },
//   sinkType: "console",
//   sinkOptions: {},
// };

// export default function transform({ events }: Block) {
//   return (events ?? []).map(({ event }) => {
//     const { fromAddress } = event;
//     let data: Object = {};

//     if (UNSTABLE_TOKENS_ARRAY.includes(fromAddress)) {
//       const [from, to, amount] = event.data;
//       // The request is not awaited, so we do not slow down the indexer.
//       autoSwap({ from: fromAddress, to, amount });
//       data = { from, to, amount };
//       return {
//         fromAddress,
//         data,
//       };
//     }

//     if (fromAddress === AUTOSWAPPR_CONTRACT_ADDRESS) {
//       const [
//         from_token,
//         amount_from,
//         _,
//         to_token,
//         amount_to,
//         __,
//         wallet_address,
//         _provider,
//       ] = event.data;
//       // The request is not awaited, so we do not slow down the indexer.
//       logTransaction({
//         wallet_address,
//         from_token,
//         to_token,
//         amount_from,
//         amount_to,
//       });
//       data = { from_token, amount_from, to_token, amount_to, wallet_address };
//       return {
//         fromAddress,
//         data,
//       };
//     }

//     return {
//       fromAddress,
//       data,
//     };
//   });
// }