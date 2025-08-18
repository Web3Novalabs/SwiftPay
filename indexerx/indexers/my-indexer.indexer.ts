import { defineIndexer } from "apibara/indexer";
import { drizzle, drizzleStorage, useDrizzleStorage } from "@apibara/plugin-drizzle";
import { StarknetStream, getSelector } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import { eq, and } from "drizzle-orm";
import { useLogger } from "apibara/plugins";
import { groups, deployedGroups, tokenTransfers, groupMembers } from "../lib/schema";
import { ContractUtils } from "../lib/contract-utils";

// Create drizzle instance
const drizzleDb = drizzle({
  schema: {
    groups,
    deployedGroups,
    tokenTransfers,
    groupMembers,
  },
});

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { startingBlock, streamUrl, contractAddress } = runtimeConfig.myIndexer;

  // Initialize Starknet connection for contract interactions
  ContractUtils.initialize().catch(error => {
    console.error("❌ Failed to initialize Starknet connection:", error);
    console.log("⚠️ Contract interactions will not work without proper Starknet configuration");
  });

  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    filter: {
      events: [
        // Listen for GroupCreation events from AutoShare contract
        {
          address: "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d",
          keys: ["0x00839204f70183a4f6833c236b5e21b7309088e1defb43d00a9945ac05fdb27d"]
        },
        // Listen for ERC20 Transfer events to any contract (we'll filter by recipient in code)
        {
          keys: [getSelector("Transfer")]
        }
      ],
    },
    plugins: [
      drizzleStorage({
        db: drizzleDb,
      }),
    ],
    async transform({ block, endCursor }) {
      const logger = useLogger();
      const { events: blockEvents, header } = block;
      
      if (!header) return;
      
      logger.log(`Processing block ${header.blockNumber}`);
      
      const { db } = useDrizzleStorage(drizzleDb);

      let eventErrors = 0;
      for (const event of blockEvents) {
        try {
          await processEvent(db, event, header.blockNumber, BigInt(header.timestamp.getTime()));
        } catch (error) {
          eventErrors++;
          logger.error(`Error processing event ${eventErrors}/${blockEvents.length}: ${error}`);
          // Continue processing other events instead of failing the entire block
        }
      }
      
      if (eventErrors > 0) {
        logger.warn(`Processed block with ${eventErrors} event errors out of ${blockEvents.length} total events`);
      }

      // Update cursor - handle the cursor properly
      if (endCursor) {
        const cursorValue = typeof endCursor === 'object' && 'orderKey' in endCursor 
          ? Number(endCursor.orderKey) 
          : 0;
        
        try {
          // Store cursor for resuming from this point
          // Note: Cursor handling is simplified for now
          console.log(`�� Processed block ${header.blockNumber}, cursor: ${cursorValue}`);
        } catch (error) {
          console.error("Error handling cursor:", error);
          // Continue processing even if cursor handling fails
        }
      }
    },
  });
}

async function processEvent(
  db: any,
  event: any,
  blockNumber: bigint,
  timestamp: bigint
) {
  try {
    // Extract event key (first key in the keys array)
    const eventKey = event.keys[0];
    
    // Only process events we care about
    if (eventKey === "0x00839204f70183a4f6833c236b5e21b7309088e1defb43d00a9945ac05fdb27d") {
      // GroupCreated event (Fel252 key)
      console.log("✅ Processing GroupCreated event");
      
      const groupAddress = event.keys[1];
      console.log("🔍 Parsed GroupCreated event - group_address from keys[1]:", groupAddress);
      
      const eventData = {
        group_id: event.data[0],
        creator: event.data[1],
        name: event.data[2],
        group_address: groupAddress
      };

      console.log("Processing event: GroupCreated", {
        eventData,
        transactionHash: event.transactionHash,
        blockNumber,
        timestamp
      });

      await handleGroupCreated(db, eventData, blockNumber, timestamp);
      console.log("✅ GroupCreated event processed successfully");
    }
    else if (eventKey === getSelector("Transfer")) {
      // ERC20 Transfer event - check if recipient is a stored group address
      const toAddress = event.data[1];
      
      // Check if this transfer is to one of our stored group addresses
      const isGroupAddress = await ContractUtils.isDeployedGroupAddress(db, toAddress);
      
      if (isGroupAddress) {
        console.log(`🎯 ERC20 Transfer to group address: ${toAddress}`);
        
        const eventData = {
          from: event.data[0],
          to: toAddress,
          amount: event.data[2],
          token_address: event.address,
          transaction_hash: event.transactionHash
        };

        await handleTokenTransfer(db, eventData, blockNumber, timestamp);
        console.log("✅ Token transfer to group processed successfully");
      }
      // Silently ignore transfers to non-group addresses
    }
    // Silently ignore all other events
    
  } catch (error) {
    console.error("❌ Error processing event:", error);
    // Don't throw - just log and continue
  }
}

async function handleGroupCreated(db: any, eventData: any, blockNumber: bigint, timestamp: bigint) {
  try {
    const { group_address, group_id, creator, name } = eventData;
    
    console.log("Processing GroupCreated event data:", eventData);
    
    // Convert Starknet field values properly
    // group_id might be a hex string or object, convert to number
    let groupId: number;
    if (typeof group_id === 'string') {
      groupId = parseInt(group_id, 16);
    } else if (typeof group_id === 'object' && group_id.x0 !== undefined) {
      // Handle Starknet field element format
      groupId = Number(group_id.x0);
    } else {
      groupId = Number(group_id);
    }
    
    // Convert creator address
    let creatorAddress: string;
    if (typeof creator === 'string') {
      creatorAddress = creator;
    } else if (typeof creator === 'object' && creator.x0 !== undefined) {
      // Handle Starknet field element format
      creatorAddress = `0x${creator.x0.toString(16)}`;
    } else {
      creatorAddress = String(creator);
    }
    
    // Convert name (might be hex encoded)
    let groupName: string;
    if (typeof name === 'string') {
      if (name.startsWith('0x')) {
        // Convert hex to string
        groupName = Buffer.from(name.slice(2), 'hex').toString('utf8').replace(/\0/g, '');
      } else {
        groupName = name;
      }
    } else if (typeof name === 'object' && name.x0 !== undefined) {
      // Handle Starknet field element format
      const hexName = `0x${name.x0.toString(16)}`;
      groupName = Buffer.from(hexName.slice(2), 'hex').toString('utf8').replace(/\0/g, '');
    } else {
      groupName = String(name);
    }
    
    // Convert group address
    let childContractAddress: string;
    if (typeof group_address === 'string') {
      childContractAddress = group_address;
    } else if (typeof group_address === 'object' && group_address.x0 !== undefined) {
      // Handle Starknet field element format
      childContractAddress = `0x${group_address.x0.toString(16)}`;
    } else {
      childContractAddress = String(group_address);
    }
    
    console.log("Converted values:", {
      groupId,
      creatorAddress,
      groupName,
      childContractAddress
    });
    
    // Check if group already exists
    const existingGroup = await db.select().from(groups).where(eq(groups.group_id, groupId)).limit(1);
    
    if (existingGroup.length === 0) {
      // Insert new group
      await db.insert(groups).values({
        group_id: groupId,
        name: groupName,
        is_paid: false,
        creator: creatorAddress,
        status: "active",
      });
      console.log(`✅ Inserted new group ${groupId}`);
    } else {
      // Update existing group
      await db.update(groups).set({
        name: groupName,
        creator: creatorAddress,
        updated_at: new Date(),
      }).where(eq(groups.group_id, groupId));
      console.log(`🔄 Updated existing group ${groupId}`);
    }

    // Check if deployed group already exists
    const existingDeployedGroup = await db.select().from(deployedGroups).where(eq(deployedGroups.group_id, groupId)).limit(1);
    
    if (existingDeployedGroup.length === 0) {
      // Insert new deployed group
      await db.insert(deployedGroups).values({
        group_id: groupId,
        deployed_address: childContractAddress,
        is_active: true,
        deployment_block: Number(blockNumber),
        deployment_timestamp: Number(timestamp),
      });
      console.log(`✅ Inserted new deployed group ${groupId} at ${childContractAddress}`);
    } else {
      // Update existing deployed group
      await db.update(deployedGroups).set({
        deployed_address: childContractAddress,
        is_active: true,
        deployment_block: Number(blockNumber),
        deployment_timestamp: Number(timestamp),
        updated_at: new Date(),
      }).where(eq(deployedGroups.group_id, groupId));
      console.log(`🔄 Updated existing deployed group ${groupId} at ${childContractAddress}`);
    }

    console.log("✅ GroupCreated event processed successfully");
  } catch (error) {
    console.error("❌ Error in handleGroupCreated:", error);
    throw error;
  }
}

async function handleTokenTransfer(db: any, eventData: any, blockNumber: bigint, timestamp: bigint) {
  try {
    const { from, to, amount, token_address, transaction_hash } = eventData;
    
    console.log("🎯 Processing TokenTransfer event:", eventData);
    
    // Check if the recipient address is a deployed group address
    const deployedGroup = await db.select().from(deployedGroups).where(eq(deployedGroups.deployed_address, to)).limit(1);
    const deployedGroupData = deployedGroup[0];
    
    if (deployedGroupData) {
      console.log(`💰 Token transfer detected to group ${deployedGroupData.group_id} at address ${to}`);
      
      // Store the token transfer
      const transferResult = await db.insert(tokenTransfers).values({
        group_id: deployedGroupData.group_id,
        deployed_address: to,
        token_address: token_address,
        amount: Number(amount),
        from_address: from,
        transaction_hash: transaction_hash,
        block_number: Number(blockNumber),
        block_timestamp: Number(timestamp),
        is_processed: false,
      }).returning();
      
      console.log(`💾 Token transfer stored with ID: ${transferResult[0].id}`);
      
      // Trigger payment to group members
      const paymentResult = await ContractUtils.triggerGroupPayment(
        db,
        deployedGroupData.group_id,
        to,
        token_address,
        amount,
        transaction_hash
      );
      
      // Mark the transfer as processed
      await db
        .update(tokenTransfers)
        .set({ 
          is_processed: true,
          payment_tx_hash: paymentResult.transactionHash || "unknown",
        })
        .where(eq(tokenTransfers.id, transferResult[0].id));
      
      console.log(`✅ Payment triggered for group ${deployedGroupData.group_id}`);
    }
    
  } catch (error) {
    console.error("❌ Error in handleTokenTransfer:", error);
    throw error;
  }
}