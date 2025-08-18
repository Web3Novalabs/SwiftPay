import { RpcProvider, Account, ec, Call } from "starknet";
import { eq } from "drizzle-orm";
import { deployedGroups, tokenTransfers, groups, groupMembers } from "./schema";

export interface PaymentTrigger {
  groupId: number;
  groupAddress: string;
  tokenAddress: string;
  amount: string;
  transactionHash: string;
}

export interface ContractCallResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Utility class for contract interactions
 * This provides a foundation for implementing actual contract calls
 */
export class ContractUtils {
  static provider: RpcProvider;
  private static account: Account;
  private static contractAddress: string;
  private static isInitialized = false;

  /**
   * Initialize Starknet connection and account
   */
  static async initialize() {
    try {
      // Get configuration from environment variables
      const rpcUrl = process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io";
      const privateKey = process.env.PRIVATE_KEY;
      const accountAddress = process.env.ACCOUNT_ADDRESS;
      const contractAddress = process.env.MAIN_CONTRACT_ADDRESS;

      if (!privateKey || !accountAddress || !contractAddress) {
        throw new Error("Missing required environment variables: PRIVATE_KEY, ACCOUNT_ADDRESS, MAIN_CONTRACT_ADDRESS");
      }

      // Initialize provider
      this.provider = new RpcProvider({ nodeUrl: rpcUrl });
      
      // Initialize account with proper version for Argent compatibility
      const privateKeyFelt = ec.starkCurve.getStarkKey(privateKey);
      
      // Argent accounts often need version "1" and specific account class
      try {
        // Try with version "1" first (Argent standard)
        this.account = new Account(this.provider, accountAddress, privateKeyFelt, "1");
        console.log("✅ Account initialized with version 1 (Argent compatible)");
      } catch (accountError) {
        console.log("⚠️ Version 1 failed, trying version 0");
        this.account = new Account(this.provider, accountAddress, privateKeyFelt, "0");
      }
      
      this.contractAddress = contractAddress;
      
      this.isInitialized = true;
      console.log("✅ Starknet connection initialized successfully");
      console.log(`📡 RPC URL: ${rpcUrl}`);
      console.log(`👤 Account: ${accountAddress}`);
      console.log(`📋 Contract: ${contractAddress}`);
      
      // Test the connection
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`🔗 Connection test successful - Latest block: ${blockNumber}`);
      } catch (testError) {
        console.warn("⚠️ Connection test failed, but continuing:", testError);
        
        // Try multiple alternative RPC endpoints if the main one fails
        const alternativeEndpoints = [
          "https://alpha-sepolia.starknet.io",
          "https://starknet-sepolia.public.blastapi.io",
          "https://free-rpc.nethermind.io/sepolia-juno"
        ];
        
        for (const endpoint of alternativeEndpoints) {
          console.log(`🔄 Trying alternative RPC endpoint: ${endpoint}`);
          try {
            const altProvider = new RpcProvider({ nodeUrl: endpoint });
            const altBlockNumber = await altProvider.getBlockNumber();
            console.log(`✅ Alternative RPC working - Latest block: ${altBlockNumber}`);
            
            // Switch to alternative provider
            this.provider = altProvider;
            
            // Reinitialize account with new provider
            try {
              this.account = new Account(altProvider, accountAddress, privateKeyFelt, "1");
            } catch (accountError) {
              this.account = new Account(altProvider, accountAddress, privateKeyFelt, "0");
            }
            
            console.log(`🔄 Switched to alternative RPC endpoint: ${endpoint}`);
            break;
            
          } catch (altError) {
            console.warn(`⚠️ Alternative RPC ${endpoint} failed:`, altError);
          }
        }
      }
      
    } catch (error) {
      console.error("❌ Failed to initialize Starknet connection:", error);
      throw error;
    }
  }

  /**
   * Check if a given address is a deployed group address
   */
  static async isDeployedGroupAddress(db: any, address: string): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(deployedGroups)
        .where(eq(deployedGroups.deployed_address, address))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error("❌ Error checking deployed group address:", error);
      return false;
    }
  }

  /**
   * Get deployed group information by address
   */
  static async getDeployedGroupByAddress(db: any, address: string) {
    try {
      const result = await db
        .select()
        .from(deployedGroups)
        .where(eq(deployedGroups.deployed_address, address))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error("❌ Error getting deployed group:", error);
      return null;
    }
  }

  /**
   * Trigger payment for a group
   */
  static async triggerGroupPayment(
    db: any,
    groupId: number,
    groupAddress: string,
    tokenAddress: string,
    amount: string,
    transactionHash: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log(`💰 Triggering payment for group ${groupId}`);
      console.log(`📍 Group address: ${groupAddress}`);
      console.log(`🪙 Token address: ${tokenAddress}`);
      console.log(`💎 Amount: ${amount}`);

      // Get group members
      const members = await this.getGroupMembers(db, groupId);
      
      if (!members || members.length === 0) {
        console.warn(`⚠️ No members found for group ${groupId}`);
        return { success: false, error: "No members found" };
      }

      console.log(`👥 Found ${members.length} members for group ${groupId}`);
      members.forEach((member: any, index: number) => {
        console.log(`  Member ${index + 1}: ${member.addr} (${member.percentage}%)`);
      });

      // Call the contract's pay function
      console.log("🚀 Calling contract's pay() function...");
      console.log(`📋 Contract call details:`);
      console.log(`  Contract: ${this.contractAddress}`);
      console.log(`  Function: pay`);
      console.log(`  Group Address: ${groupAddress}`);
      
      const result = await this.callContractPayFunction(groupAddress);
      
      if (result.success) {
        console.log(`✅ Payment transaction submitted successfully!`);
        console.log(`🔗 Transaction hash: ${result.transactionHash}`);
        
        // Update group status to paid
        await this.updateGroupPaymentStatus(db, groupId, result.transactionHash);
        
        return { success: true, transactionHash: result.transactionHash };
      } else {
        console.error(`❌ Payment failed: ${result.error}`);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error("❌ Error triggering group payment:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Call the contract's pay function
   */
  private static async callContractPayFunction(groupAddress: string): Promise<any> {
    try {
      // Prepare the call to the contract's pay function
      const call: Call = {
        contractAddress: this.contractAddress,
        entrypoint: "pay",
        calldata: [groupAddress] // Only need group_address, contract handles the rest
      };

      console.log("📋 Contract call details:");
      console.log(`  Contract: ${this.contractAddress}`);
      console.log(`  Function: pay`);
      console.log(`  Group Address: ${groupAddress}`);

      // Execute the transaction
      const result = await this.account.execute([call]);
      
      return result;
      
    } catch (error) {
      console.error("❌ Error calling contract pay function:", error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Contract pay() call failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get group members with database caching
   */
  static async getGroupMembers(db: any, groupId: number): Promise<any[]> {
    try {
      console.log(`🔍 Getting members for group ${groupId}...`);
      
      // First, try to get members from database cache
      const cachedMembers = await this.getCachedGroupMembers(db, groupId);
      
      if (cachedMembers && cachedMembers.length > 0) {
        console.log(`✅ Found ${cachedMembers.length} cached members in database`);
        return cachedMembers;
      }
      
      // If no cached members, query the contract
      console.log(`📡 No cached members found, querying contract...`);
      const contractMembers = await this.queryContractForMembers(groupId);
      
      if (contractMembers && contractMembers.length > 0) {
        console.log(`✅ Found ${contractMembers.length} members from contract`);
        
        // Cache the members in database for future use
        await this.cacheGroupMembers(db, groupId, contractMembers);
        
        return contractMembers;
      }
      
      console.log(`⚠️ No members found in contract for group ${groupId}`);
      return [];
      
    } catch (error) {
      console.error("❌ Error getting group members:", error);
      return [];
    }
  }

  /**
   * Get cached group members from database
   */
  private static async getCachedGroupMembers(db: any, groupId: number): Promise<any[]> {
    try {
      // Query the group_members table for cached members
      const result = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.group_id, groupId))
        .orderBy(groupMembers.percentage);
      
      return result;
      
    } catch (error) {
      console.error("❌ Error getting cached group members:", error);
      return [];
    }
  }

  /**
   * Query contract for group members using get_group_member function
   */
  private static async queryContractForMembers(groupId: number): Promise<any[]> {
    try {
      console.log(`🔍 Querying contract for group ${groupId} members...`);
      
      // In Cairo, u256 is represented as two u128 values (low and high)
      // Convert the groupId to the proper u256 format
      const groupIdBigInt = BigInt(groupId);
      const low = groupIdBigInt & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn; // Lower 128 bits
      const high = (groupIdBigInt >> 128n) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn; // Upper 128 bits
      
      // Convert to hex strings
      const lowHex = `0x${low.toString(16)}`;
      const highHex = `0x${high.toString(16)}`;
      
      console.log(`📋 Calldata: group_id = ${groupId} -> u256[low: ${lowHex}, high: ${highHex}]`);
      
      // Call get_group_member with proper u256 format
      const result = await this.provider.callContract({
        contractAddress: this.contractAddress,
        entrypoint: "get_group_member",
        calldata: [lowHex, highHex] // u256 as [low, high]
      });
      
      console.log(`📡 Contract response:`, result);
      
      // Parse the returned data
      if (result && result.length > 0) {
        const members = this.parseGroupMembersFromContract(result);
        console.log(`✅ Parsed ${members.length} members from contract response`);
        return members;
      }
      
      return [];
      
    } catch (error) {
      console.error("❌ Error querying contract for members:", error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // Try alternative approach using account.callContract
      console.log("🔄 Attempting alternative contract query method...");
      
      try {
        const groupIdBigInt = BigInt(groupId);
        const low = groupIdBigInt & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
        const high = (groupIdBigInt >> 128n) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
        const lowHex = `0x${low.toString(16)}`;
        const highHex = `0x${high.toString(16)}`;
        
        const altResult = await this.account.callContract({
          contractAddress: this.contractAddress,
          entrypoint: "get_group_member",
          calldata: [lowHex, highHex]
        });
        
        console.log(`📡 Alternative contract response:`, altResult);
        
        if (altResult && altResult.length > 0) {
          const members = this.parseGroupMembersFromContract(altResult);
          console.log(`✅ Parsed ${members.length} members from alternative method`);
          return members;
        }
        
      } catch (altError) {
        console.error("❌ Alternative method also failed:", altError);
      }
      
      return [];
    }
  }

  /**
   * Parse group members from contract response
   * Contract returns: [length, addr1, percentage1, addr2, percentage2, ...]
   */
  private static parseGroupMembersFromContract(response: any[]): any[] {
    console.log("🔍 Parsing contract response for group members...");
    console.log("Contract response structure:", response);
    
    if (!response || response.length === 0) {
      console.log("⚠️ Empty response from contract");
      return [];
    }
    
    try {
      // First element should be the array length
      const memberCount = parseInt(response[0], 16);
      console.log(`📊 Expected member count: ${memberCount}`);
      
      if (memberCount === 0) {
        console.log("ℹ️ No members in group");
        return [];
      }
      
      // Each member has 2 elements: address and percentage
      const expectedLength = 1 + (memberCount * 2);
      if (response.length !== expectedLength) {
        console.warn(`⚠️ Response length mismatch: expected ${expectedLength}, got ${response.length}`);
      }
      
      const members = [];
      for (let i = 0; i < memberCount; i++) {
        const baseIndex = 1 + (i * 2);
        const address = response[baseIndex];
        const percentage = parseInt(response[baseIndex + 1], 16);
        
        console.log(`👤 Member ${i + 1}: address=${address}, percentage=${percentage}%`);
        
        members.push({
          addr: address,
          percentage: percentage
        });
      }
      
      console.log(`✅ Successfully parsed ${members.length} members`);
      return members;
      
    } catch (error) {
      console.error("❌ Error parsing group members:", error);
      return [];
    }
  }

  /**
   * Cache group members in database for future use
   */
  private static async cacheGroupMembers(db: any, groupId: number, members: any[]): Promise<void> {
    try {
      console.log(`💾 Caching ${members.length} members for group ${groupId} in database...`);
      
      // Insert members into the group_members table
      for (const member of members) {
        await db.insert(groupMembers).values({
          group_id: groupId,
          member_address: member.addr,
          percentage: member.percentage,
          is_active: true,
        });
      }
      
      console.log(`✅ Group members cached successfully`);
      
    } catch (error) {
      console.error("❌ Error caching group members:", error);
    }
  }

  /**
   * Update group payment status in database
   */
  private static async updateGroupPaymentStatus(db: any, groupId: number, transactionHash: string) {
    try {
      await db
        .update(groups)
        .set({ 
          is_paid: true,
          updated_at: new Date()
        })
        .where(eq(groups.group_id, groupId));
      
      console.log(`✅ Updated group ${groupId} payment status to paid`);
    } catch (error) {
      console.error("❌ Error updating group payment status:", error);
    }
  }

  /**
   * Get contract address
   */
  static getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Check if Starknet connection is initialized
   */
  static isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Configuration for contract interactions
 */
export const CONTRACT_CONFIG = {
  // These would be loaded from environment variables in production
  RPC_URL: process.env.STARKNET_RPC_URL || "https://sepolia.starknet.a5a.ch",
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",
  CONTRACT_ABI_PATH: process.env.CONTRACT_ABI_PATH || "./contracts/group.abi.json",
  
  // Gas settings
  MAX_FEE: process.env.MAX_FEE || "1000000000000000", // 0.001 ETH in wei
  GAS_LIMIT: process.env.GAS_LIMIT || "300000",
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * Helper function to format amounts for display
 */
export function formatAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr}`;
}

/**
 * Helper function to validate Starknet addresses
 */
export function isValidStarknetAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{63,64}$/.test(address);
} 