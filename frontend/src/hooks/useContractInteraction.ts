import { useAccount, useContract, useReadContract } from "@starknet-react/core";
import { useState } from "react";
import { CreateGroupData, PAYMESH_ADDRESS } from "../utils/contract";
import { Abi } from "starknet";

export function useContractFetch(
  abi: Abi,
  functionName: string,
  args: []
) {
  const {
    data: readData,
    refetch: dataRefetch,
    isError: readIsError,
    isLoading: readIsLoading,
    error: readError,
    isFetching: readRefetching,
  } = useReadContract({
    abi: abi,
    functionName: functionName,
    address: PAYMESH_ADDRESS,
    args: args,
    refetchInterval: 600000,
  });

  return {
    readData,
    dataRefetch,
    readIsError,
    readIsLoading,
    readError,
    readRefetching,
  };
}

export const useContractInteraction = () => {
  const { account } = useAccount();

  const { contract } = useContract({
    address:
      "0x049dba901f9a9c50509c070c47f37d191783b24ec8021b06ec5d8464af827918",
    abi: [
      {
        type: "function",
        name: "create_group",
        inputs: [
          { name: "name", type: "core::byte_array::ByteArray" },
          { name: "amount", type: "core::integer::u256" },
          {
            name: "members",
            type: "core::array::Array::<contract::base::types::GroupMember>",
          },
          {
            name: "token_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  });

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const createGroup = async (groupData: CreateGroupData) => {
    if (!account || !contract) {
      throw new Error("No account or contract connected");
    }

    setIsCreatingGroup(true);
    try {
      // Format the data for the contract call
      const { formatU256 } = await import("../utils/contract");

      const formattedAmount = formatU256(groupData.amount);

      // Format members as proper Cairo structs
      const formattedMembers = groupData.members.map((member) => ({
        addr: member.addr,
        percentage: member.percentage,
      }));

      console.log("Creating group with data:", {
        name: groupData.name,
        amount: formattedAmount,
        members: formattedMembers,
        tokenAddress: groupData.tokenAddress,
      });

      const result = await contract.create_group(
        groupData.name, // Pass name as string directly
        formattedAmount,
        formattedMembers,
        groupData.tokenAddress
      );

      console.log("Transaction result:", result);
      return result;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return {
    createGroup,
    isCreatingGroup,
    account,
  };
};