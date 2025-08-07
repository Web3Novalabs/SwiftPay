import { Block } from "https://esm.sh/@apibara/indexer@0.3.1/starknet";
import type {
  Config,
  NetworkOptions,
  SinkOptions,
} from "https://esm.sh/@apibara/indexer";
import { startingBlock } from "./net.ts";
import {
  AUTOSHARE_CONTRACT_ADDRESS,
  GROUP_CREATED_EVENT_KEY,
  GROUP_UPDATED_EVENT_KEY,
  GROUP_UPDATE_REQUESTED_EVENT_KEY,
  GROUP_UPDATE_APPROVED_EVENT_KEY,
  GROUP_UPDATE_EXECUTED_EVENT_KEY,
  PAYMENT_EVENT_KEY,
  TOKEN_ADDRESSES,
  TRANSFER_EVENT_KEY,
} from "./constants.ts";
import {
  processGroupCreated,
  processGroupUpdated,
  processGroupUpdateRequested,
  processGroupUpdateApproved,
  processGroupUpdateExecuted,
  processPayment,
  processTokenTransfer,
} from "./net.ts";

export const config: Config<NetworkOptions, SinkOptions> = {
  streamUrl: "https://mainnet.starknet.a5a.ch",
  startingBlock: startingBlock,
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  filter: {
    header: {
      weak: true,
    },
    events: [
      // AutoShare contract events
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [GROUP_CREATED_EVENT_KEY],
        includeReceipt: false,
      },
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [GROUP_UPDATED_EVENT_KEY],
        includeReceipt: false,
      },
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [GROUP_UPDATE_REQUESTED_EVENT_KEY],
        includeReceipt: false,
      },
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [GROUP_UPDATE_APPROVED_EVENT_KEY],
        includeReceipt: false,
      },
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [GROUP_UPDATE_EXECUTED_EVENT_KEY],
        includeReceipt: false,
      },
      {
        fromAddress: AUTOSHARE_CONTRACT_ADDRESS,
        keys: [PAYMENT_EVENT_KEY],
        includeReceipt: false,
      },
      // Token transfer events
      {
        fromAddress: TOKEN_ADDRESSES[0], // STRK token
        keys: [TRANSFER_EVENT_KEY],
        includeReceipt: false,
      },
      {
        fromAddress: TOKEN_ADDRESSES[1], // ETH token
        keys: [TRANSFER_EVENT_KEY],
        includeReceipt: false,
      },
    ],
  },
  sinkType: "console",
  sinkOptions: {},
};

export default function transform({ events }: Block) {
  return (events ?? []).map(({ event }) => {
    const { fromAddress, data } = event;
    let processedData: any = {};

    // Process AutoShare contract events
    if (fromAddress === AUTOSHARE_CONTRACT_ADDRESS) {
      const eventKey = event.keys[0];
      
      switch (eventKey) {
        case GROUP_CREATED_EVENT_KEY:
          // Parse group creation event data
          const [groupId, name, groupAmount, creator, ...memberData] = data;
          const members = parseMembers(memberData);
          
          // Process the event (not awaited to avoid slowing down indexer)
          processGroupCreated({
            groupId,
            name,
            amount: groupAmount,
            creator,
            members,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
          });
          
          processedData = { groupId, name, amount: groupAmount, creator, members };
          break;

        case GROUP_UPDATED_EVENT_KEY:
          // Parse group update event data
          const [updateGroupId, newName, newAmount, ...newMemberData] = data;
          const newMembers = parseMembers(newMemberData);
          
          processGroupUpdated({
            groupId: updateGroupId,
            newName,
            newAmount,
            newMembers,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
          });
          
          processedData = { groupId: updateGroupId, newName, newAmount, newMembers };
          break;

        case GROUP_UPDATE_REQUESTED_EVENT_KEY:
          // Parse group update request event data
          const [requestGroupId, requester, requestNewName, requestNewAmount, ...requestMemberData] = data;
          const requestMembers = parseMembers(requestMemberData);
          
          processGroupUpdateRequested({
            groupId: requestGroupId,
            requester,
            newName: requestNewName,
            newAmount: requestNewAmount,
            newMembers: requestMembers,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
          });
          
          processedData = { groupId: requestGroupId, requester, newName: requestNewName, newAmount: requestNewAmount, newMembers: requestMembers };
          break;

        case GROUP_UPDATE_APPROVED_EVENT_KEY:
          // Parse group update approval event data
          const [approveGroupId, approver] = data;
          
          processGroupUpdateApproved({
            groupId: approveGroupId,
            approver,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
          });
          
          processedData = { groupId: approveGroupId, approver };
          break;

        case GROUP_UPDATE_EXECUTED_EVENT_KEY:
          // Parse group update execution event data
          const [executeGroupId, executor] = data;
          
          processGroupUpdateExecuted({
            groupId: executeGroupId,
            executor,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
          });
          
          processedData = { groupId: executeGroupId, executor };
          break;

        case PAYMENT_EVENT_KEY:
          // Parse payment event data
          const [paymentGroupId, fromAddress, toAddress, paymentAmount, tokenAddress] = data;
          
          processPayment({
            groupId: paymentGroupId,
            fromAddress,
            toAddress,
            amount: paymentAmount,
            tokenAddress,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
          });
          
          processedData = { groupId: paymentGroupId, fromAddress, toAddress, amount: paymentAmount, tokenAddress };
          break;
      }
    }

    // Process token transfer events
    if (TOKEN_ADDRESSES.includes(fromAddress)) {
      const [from, to, amount] = data;
      
      processTokenTransfer({
        from,
        to,
        amount,
        tokenAddress: fromAddress,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        logIndex: event.logIndex,
      });
      
      processedData = { from, to, amount, tokenAddress: fromAddress };
    }

    return {
      fromAddress,
      data: processedData,
    };
  });
}

/**
 * Parse member data from event data array
 * Expected format: [addr1, percentage1, addr2, percentage2, ...]
 */
export function parseMembers(memberData: string[]): Array<{ addr: string; percentage: number }> {
  const members: Array<{ addr: string; percentage: number }> = [];
  
  for (let i = 0; i < memberData.length; i += 2) {
    if (i + 1 < memberData.length) {
      members.push({
        addr: memberData[i],
        percentage: parseInt(memberData[i + 1]),
      });
    }
  }
  
  return members;
} 