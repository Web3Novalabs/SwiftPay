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