import { eq } from "drizzle-orm";
import { deployedGroups, tokenTransfers, groups, groupMembers } from "./schema";

export interface PaymentTrigger {
  groupId: number;
  groupAddress: string;
  tokenAddress: string;
  amount: bigint;
  members: Array<{
    member_address: string;
    percentage: number;
  }>;
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
  /**
   * Trigger payment to group members
   * This is a placeholder implementation that logs the action
   * In production, this would make actual contract calls
   */
  static async triggerGroupPayment(
    db: any,
    groupId: number,
    groupAddress: string,
    tokenAddress: string,
    amount: bigint
  ): Promise<ContractCallResult> {
    try {
      console.log(`🔔 Triggering payment for group ${groupId}`);
      console.log(`📍 Group address: ${groupAddress}`);
      console.log(`🪙 Token address: ${tokenAddress}`);
      console.log(`💰 Amount: ${amount}`);
      
      // Get group members with their percentages
      const members = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.group_id, groupId));
      
      if (members.length === 0) {
        console.log(`⚠️ No members found for group ${groupId}`);
        return { success: false, error: "No members found" };
      }
      
      console.log(`👥 Found ${members.length} members for group ${groupId}`);
      
      // Calculate individual payments based on percentages
      const totalPercentage = members.reduce((sum: number, member: any) => sum + member.percentage, 0);
      const payments = members.map((member: any) => {
        const memberAmount = (Number(amount) * member.percentage) / totalPercentage;
        return {
          address: member.member_address,
          percentage: member.percentage,
          amount: memberAmount,
        };
      });
      
      console.log("💸 Payment breakdown:");
      payments.forEach((payment: any) => {
        console.log(`  ${payment.address}: ${payment.percentage}% = ${payment.amount}`);
      });
      
      // TODO: Implement actual contract call
      // This would involve:
      // 1. Getting the contract ABI for the group contract
      // 2. Creating a contract instance
      // 3. Calling the pay function with the calculated amounts
      // 4. Handling the transaction response
      
      // For now, simulate a successful contract call
      const simulatedTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      
      console.log(`✅ Payment triggered successfully (simulated)`);
      console.log(`📝 Transaction hash: ${simulatedTxHash}`);
      
      // Update group status to indicate payment is being processed
      await db
        .update(groups)
        .set({ 
          status: "paid",
          is_paid: true,
        })
        .where(eq(groups.group_id, groupId));
      
      return {
        success: true,
        transactionHash: simulatedTxHash,
      };
      
    } catch (error) {
      console.error("❌ Error triggering group payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
  
  /**
   * Check if an address is a deployed group address
   */
  static async isDeployedGroupAddress(db: any, address: string): Promise<boolean> {
    try {
      const result = await db
        .select({ count: 1 })
        .from(deployedGroups)
        .where(eq(deployedGroups.deployed_address, address))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if address is deployed group:", error);
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
      console.error("Error getting deployed group by address:", error);
      return null;
    }
  }
  
  /**
   * Get all active deployed groups
   */
  static async getActiveDeployedGroups(db: any) {
    try {
      return await db
        .select()
        .from(deployedGroups)
        .where(eq(deployedGroups.is_active, true));
    } catch (error) {
      console.error("Error getting active deployed groups:", error);
      return [];
    }
  }
  
  /**
   * Mark a token transfer as processed
   */
  static async markTokenTransferProcessed(
    db: any,
    transactionHash: string,
    paymentTxHash: string
  ) {
    try {
      await db
        .update(tokenTransfers)
        .set({ 
          is_processed: true,
          payment_tx_hash: paymentTxHash,
        })
        .where(eq(tokenTransfers.transaction_hash, transactionHash));
      
      console.log(`✅ Token transfer ${transactionHash} marked as processed`);
    } catch (error) {
      console.error("Error marking token transfer as processed:", error);
    }
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