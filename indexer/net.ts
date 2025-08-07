/**
 * Network utilities for SwiftPay indexer
 */

import { BACKEND_BASE_URL, WEBHOOK_ENDPOINT } from "./constants.ts";

/**
 * Get the current block number from Starknet Mainnet
 * curl -X POST https://starknet-mainnet.public.blastapi.io
 * -H 'Content-Type: application/json'
 * -d '{"jsonrpc":"2.0","id":0,"method":"starknet_blockNumber"}'
 */
export const startingBlock = await fetch(
  "https://starknet-mainnet.public.blastapi.io",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "starknet_blockNumber",
    }),
  },
)
  .then((response) => response.json())
  .then((data) => data.result);

/**
 * Send blockchain events to SwiftPay backend webhook
 * curl -X POST http://swiftpay-backend:3000/api/v1/webhooks/blockchain-events
 * -H 'Content-Type: application/json'
 * -d '{
 *   "events": [
 *     {
 *       "eventType": "GroupCreated",
 *       "contractAddress": "0x123...",
 *       "transactionHash": "0xabc...",
 *       "blockNumber": 12345,
 *       "logIndex": 0,
 *       "eventData": {...}
 *     }
 *   ]
 * }'
 */
export const sendBlockchainEvents = async (events: Array<{
  eventType: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
  eventData: any;
}>) => {
  try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      console.error(`Failed to send events to backend: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending events to backend:", error);
  }
};

/**
 * Process group creation event
 */
export const processGroupCreated = async ({
  groupId,
  name,
  amount,
  creator,
  members,
  transactionHash,
  blockNumber,
  logIndex,
}: {
  groupId: string;
  name: string;
  amount: string;
  creator: string;
  members: Array<{ addr: string; percentage: number }>;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}) => {
  const event = {
    eventType: "GroupCreated",
    contractAddress: "AUTOSHARE_CONTRACT_ADDRESS", // Replace with actual address
    transactionHash,
    blockNumber,
    logIndex,
    eventData: {
      groupId,
      name,
      amount,
      creator,
      members,
    },
  };

  await sendBlockchainEvents([event]);
};

/**
 * Process group update event
 */
export const processGroupUpdated = async ({
  groupId,
  newName,
  newAmount,
  newMembers,
  transactionHash,
  blockNumber,
  logIndex,
}: {
  groupId: string;
  newName: string;
  newAmount: string;
  newMembers: Array<{ addr: string; percentage: number }>;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}) => {
  const event = {
    eventType: "GroupUpdated",
    contractAddress: "AUTOSHARE_CONTRACT_ADDRESS", // Replace with actual address
    transactionHash,
    blockNumber,
    logIndex,
    eventData: {
      groupId,
      newName,
      newAmount,
      newMembers,
    },
  };

  await sendBlockchainEvents([event]);
};

/**
 * Process group update request event
 */
export const processGroupUpdateRequested = async ({
  groupId,
  requester,
  newName,
  newAmount,
  newMembers,
  transactionHash,
  blockNumber,
  logIndex,
}: {
  groupId: string;
  requester: string;
  newName: string;
  newAmount: string;
  newMembers: Array<{ addr: string; percentage: number }>;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}) => {
  const event = {
    eventType: "GroupUpdateRequested",
    contractAddress: "AUTOSHARE_CONTRACT_ADDRESS", // Replace with actual address
    transactionHash,
    blockNumber,
    logIndex,
    eventData: {
      groupId,
      requester,
      newName,
      newAmount,
      newMembers,
    },
  };

  await sendBlockchainEvents([event]);
};

/**
 * Process group update approval event
 */
export const processGroupUpdateApproved = async ({
  groupId,
  approver,
  transactionHash,
  blockNumber,
  logIndex,
}: {
  groupId: string;
  approver: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}) => {
  const event = {
    eventType: "GroupUpdateApproved",
    contractAddress: "AUTOSHARE_CONTRACT_ADDRESS", // Replace with actual address
    transactionHash,
    blockNumber,
    logIndex,
    eventData: {
      groupId,
      approver,
    },
  };

  await sendBlockchainEvents([event]);
};

/**
 * Process group update execution event
 */
export const processGroupUpdateExecuted = async ({
  groupId,
  executor,
  transactionHash,
  blockNumber,
  logIndex,
}: {
  groupId: string;
  executor: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}) => {
  const event = {
    eventType: "GroupUpdateExecuted",
    contractAddress: "AUTOSHARE_CONTRACT_ADDRESS", // Replace with actual address
    transactionHash,
    blockNumber,
    logIndex,
    eventData: {
      groupId,
      executor,
    },
  };

  await sendBlockchainEvents([event]);
};

/**
 * Process payment event
 */
export const processPayment = async ({
  groupId,
  fromAddress,
  toAddress,
  amount,
  tokenAddress,
  transactionHash,
  blockNumber,
  logIndex,
}: {
  groupId: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}) => {
  const event = {
    eventType: "Payment",
    contractAddress: "AUTOSHARE_CONTRACT_ADDRESS", // Replace with actual address
    transactionHash,
    blockNumber,
    logIndex,
    eventData: {
      groupId,
      fromAddress,
      toAddress,
      amount,
      tokenAddress,
    },
  };

  await sendBlockchainEvents([event]);
};

/**
 * Process token transfer event
 */
export const processTokenTransfer = async ({
  from,
  to,
  amount,
  tokenAddress,
  transactionHash,
  blockNumber,
  logIndex,
}: {
  from: string;
  to: string;
  amount: string;
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}) => {
  const event = {
    eventType: "Transfer",
    contractAddress: tokenAddress,
    transactionHash,
    blockNumber,
    logIndex,
    eventData: {
      from,
      to,
      amount,
      tokenAddress,
    },
  };

  await sendBlockchainEvents([event]);
}; 