import { Contract, Account, cairo, uint256 } from "starknet";
import { SWIFTSWAP_ABI } from "../abi/swiftswap_abi";

// Contract configuration
export const CONTRACT_ADDRESS =
  "0x049dba901f9a9c50509c070c47f37d191783b24ec8021b06ec5d8464af827918";

// Types
export interface GroupMember {
  addr: string;
  percentage: number;
}

export interface CreateGroupData {
  name: string;
  amount: string;
  members: GroupMember[];
  tokenAddress: string;
}

// Utility functions
export const formatU256 = (amount: string): { low: string; high: string } => {
  const uint256Value = uint256.bnToUint256(amount);
  return {
    low: uint256Value.low.toString(),
    high: uint256Value.high.toString(),
  };
};

export const formatByteArray = (
  text: string
): { data: string[]; pending_word: string; pending_word_len: number } => {
  // Convert string to byte array format
  const bytes = Array.from(text).map((char) =>
    char.charCodeAt(0).toString(16).padStart(2, "0")
  );
  const chunks = [];

  // Split into 31-byte chunks (bytes31)
  for (let i = 0; i < bytes.length; i += 62) {
    const chunk = bytes.slice(i, i + 62).join("");
    chunks.push(`0x${chunk.padEnd(62, "0")}`);
  }

  return {
    data: chunks,
    pending_word: "0x0",
    pending_word_len: 0,
  };
};

export const formatGroupMembers = (members: GroupMember[]) => {
  return members.map((member) => ({
    addr: member.addr,
    percentage: member.percentage,
  }));
};

// Contract interaction functions
export const createContractInstance = (account: Account): Contract => {
  return new Contract(SWIFTSWAP_ABI, CONTRACT_ADDRESS, account);
};

export const createGroup = async (
  account: Account,
  groupData: CreateGroupData
): Promise<{ transaction_hash: string }> => {
  try {
    const contract = createContractInstance(account);

    // Format the data
    const formattedName = formatByteArray(groupData.name);
    const formattedAmount = formatU256(groupData.amount);
    const formattedMembers = formatGroupMembers(groupData.members);

    console.log("Creating group with data:", {
      name: formattedName,
      amount: formattedAmount,
      members: formattedMembers,
      tokenAddress: groupData.tokenAddress,
    });

    // Call the contract
    const result = await contract.create_group(
      formattedName,
      formattedAmount,
      formattedMembers,
      groupData.tokenAddress
    );

    console.log("Transaction result:", result);
    return result;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

export const getGroup = async (
  account: Account,
  groupId: string
): Promise<any> => {
  try {
    const contract = createContractInstance(account);
    const formattedGroupId = formatU256(groupId);

    const result = await contract.get_group(formattedGroupId);
    console.log("Group data:", result);
    return result;
  } catch (error) {
    console.error("Error getting group:", error);
    throw error;
  }
};

// Hook for contract interactions
export const useContract = (account: Account | null) => {
  const createGroupWithContract = async (groupData: CreateGroupData) => {
    if (!account) {
      throw new Error("No account connected");
    }
    return await createGroup(account, groupData);
  };

  const getGroupWithContract = async (groupId: string) => {
    if (!account) {
      throw new Error("No account connected");
    }
    return await getGroup(account, groupId);
  };

  return {
    createGroup: createGroupWithContract,
    getGroup: getGroupWithContract,
  };
};
