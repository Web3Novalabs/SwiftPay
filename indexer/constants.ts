/**
 * SwiftPay AutoShare Contract Addresses and Event Keys
 */

// The contract address of the STRK token deployed on Starknet Mainnet
export const STRK_TOKEN_CONTRACT_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// The contract address of the ETH token deployed on Starknet Mainnet
export const ETH_TOKEN_CONTRACT_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

// The AutoShare contract address (placeholder - replace with actual deployed address)
export const AUTOSHARE_CONTRACT_ADDRESS =
  "0x1234567890123456789012345678901234567890123456789012345678901234";

// Event keys for AutoShare contract events
export const GROUP_CREATED_EVENT_KEY =
  "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";

export const GROUP_UPDATED_EVENT_KEY =
  "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3";

export const GROUP_UPDATE_REQUESTED_EVENT_KEY =
  "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4";

export const GROUP_UPDATE_APPROVED_EVENT_KEY =
  "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5";

export const GROUP_UPDATE_EXECUTED_EVENT_KEY =
  "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6";

export const PAYMENT_EVENT_KEY =
  "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7";

// Transfer event key (standard ERC20)
export const TRANSFER_EVENT_KEY =
  "0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9";

// Array of token addresses to monitor for transfers
export const TOKEN_ADDRESSES = [
  STRK_TOKEN_CONTRACT_ADDRESS,
  ETH_TOKEN_CONTRACT_ADDRESS,
];

// Backend API endpoints
export const BACKEND_BASE_URL = "http://swiftpay-backend:3000";
export const WEBHOOK_ENDPOINT = `${BACKEND_BASE_URL}/api/v1/webhooks/blockchain-events`; 