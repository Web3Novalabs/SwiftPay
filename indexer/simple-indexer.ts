/**
 * Simple SwiftPay Indexer for Deno
 * Continuously polls StarkNet for events without requiring Apibara CLI
 */

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
  BACKEND_BASE_URL,
  WEBHOOK_ENDPOINT,
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

// Get current block number
async function getCurrentBlockNumber(): Promise<number> {
  const response = await fetch("https://starknet-mainnet.public.blastapi.io", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "starknet_blockNumber",
    }),
  });

  const data = await response.json();
  return parseInt(data.result);
}

// Get events for a specific block
async function getEventsForBlock(blockNumber: number) {
  const response = await fetch("https://starknet-mainnet.public.blastapi.io", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "starknet_getEvents",
      params: {
        from_block: { block_number: blockNumber },
        to_block: { block_number: blockNumber },
        address: [AUTOSHARE_CONTRACT_ADDRESS, ...TOKEN_ADDRESSES],
        keys: [
          [GROUP_CREATED_EVENT_KEY],
          [GROUP_UPDATED_EVENT_KEY],
          [GROUP_UPDATE_REQUESTED_EVENT_KEY],
          [GROUP_UPDATE_APPROVED_EVENT_KEY],
          [GROUP_UPDATE_EXECUTED_EVENT_KEY],
          [PAYMENT_EVENT_KEY],
          [TRANSFER_EVENT_KEY],
        ],
        chunk_size: 100,
      },
    }),
  });

  const data = await response.json();
  return data.result?.events || [];
}

// Process events
function processEvents(events: any[]) {
  for (const event of events) {
    const { from_address, data, keys, transaction_hash, block_number, log_index } = event;
    
    console.log(`Processing event from block ${block_number}:`, {
      from_address,
      keys,
      transaction_hash,
    });

    // Process AutoShare contract events
    if (from_address === AUTOSHARE_CONTRACT_ADDRESS) {
      const eventKey = keys[0];
      
      switch (eventKey) {
        case GROUP_CREATED_EVENT_KEY:
          const [groupId, name, groupAmount, creator, ...memberData] = data;
          const members = parseMembers(memberData);
          
          processGroupCreated({
            groupId,
            name,
            amount: groupAmount,
            creator,
            members,
            transactionHash: transaction_hash,
            blockNumber: block_number,
            logIndex: log_index,
          });
          break;

        case GROUP_UPDATED_EVENT_KEY:
          const [updateGroupId, newName, newAmount, ...newMemberData] = data;
          const newMembers = parseMembers(newMemberData);
          
          processGroupUpdated({
            groupId: updateGroupId,
            newName,
            newAmount,
            newMembers,
            transactionHash: transaction_hash,
            blockNumber: block_number,
            logIndex: log_index,
          });
          break;

        case GROUP_UPDATE_REQUESTED_EVENT_KEY:
          const [requestGroupId, requester, requestNewName, requestNewAmount, ...requestMemberData] = data;
          const requestMembers = parseMembers(requestMemberData);
          
          processGroupUpdateRequested({
            groupId: requestGroupId,
            requester,
            newName: requestNewName,
            newAmount: requestNewAmount,
            newMembers: requestMembers,
            transactionHash: transaction_hash,
            blockNumber: block_number,
            logIndex: log_index,
          });
          break;

        case GROUP_UPDATE_APPROVED_EVENT_KEY:
          const [approveGroupId, approver] = data;
          
          processGroupUpdateApproved({
            groupId: approveGroupId,
            approver,
            transactionHash: transaction_hash,
            blockNumber: block_number,
            logIndex: log_index,
          });
          break;

        case GROUP_UPDATE_EXECUTED_EVENT_KEY:
          const [executeGroupId, executor] = data;
          
          processGroupUpdateExecuted({
            groupId: executeGroupId,
            executor,
            transactionHash: transaction_hash,
            blockNumber: block_number,
            logIndex: log_index,
          });
          break;

        case PAYMENT_EVENT_KEY:
          const [paymentGroupId, fromAddress, toAddress, paymentAmount, tokenAddress] = data;
          
          processPayment({
            groupId: paymentGroupId,
            fromAddress,
            toAddress,
            amount: paymentAmount,
            tokenAddress,
            transactionHash: transaction_hash,
            blockNumber: block_number,
            logIndex: log_index,
          });
          break;
      }
    }

    // Process token transfer events
    if (TOKEN_ADDRESSES.includes(from_address)) {
      const [from, to, amount] = data;
      
      processTokenTransfer({
        from,
        to,
        amount,
        tokenAddress: from_address,
        transactionHash: transaction_hash,
        blockNumber: block_number,
        logIndex: log_index,
      });
    }
  }
}

/**
 * Parse member data from event data array
 * Expected format: [addr1, percentage1, addr2, percentage2, ...]
 */
function parseMembers(memberData: string[]): Array<{ addr: string; percentage: number }> {
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

// Main indexer loop
async function runIndexer() {
  console.log("🚀 Starting SwiftPay Indexer...");
  console.log("📡 Connected to StarkNet mainnet");
  console.log("👀 Monitoring events for:");
  console.log(`   - AutoShare contract: ${AUTOSHARE_CONTRACT_ADDRESS}`);
  console.log(`   - STRK token: ${TOKEN_ADDRESSES[0]}`);
  console.log(`   - ETH token: ${TOKEN_ADDRESSES[1]}`);
  console.log("🔄 Starting continuous monitoring...\n");

  let currentBlock = await getCurrentBlockNumber();
  console.log(`📍 Starting from block: ${currentBlock}`);

  // Poll for new blocks every 10 seconds
  setInterval(async () => {
    try {
      const latestBlock = await getCurrentBlockNumber();
      
      if (latestBlock > currentBlock) {
        console.log(`📦 Processing blocks ${currentBlock + 1} to ${latestBlock}`);
        
        for (let block = currentBlock + 1; block <= latestBlock; block++) {
          const events = await getEventsForBlock(block);
          
          if (events.length > 0) {
            console.log(`   📋 Found ${events.length} events in block ${block}`);
            processEvents(events);
          }
        }
        
        currentBlock = latestBlock;
      }
    } catch (error) {
      console.error("❌ Error processing blocks:", error);
    }
  }, 10000); // 10 seconds
}

// Start the indexer
if (import.meta.main) {
  runIndexer().catch(console.error);
} 