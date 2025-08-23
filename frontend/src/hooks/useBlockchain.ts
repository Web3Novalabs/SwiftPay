import {
  useContract,
  useReadContract,
  useSendTransaction,
  useTransactionReceipt,
} from "@starknet-react/core";
import { useMemo } from "react";
import { Abi, Contract, RpcProvider } from "starknet";
export const PAYMESH_CONTRACT_ADDRESS =
  "0x05cf6881a95ae50bdcd9e397ac15b35bb614ae69d1fa2080b06b94e111ec5bc6";

export function useContractFetch(
  abi: Abi,
  functionName: string,
  args: any[] = []
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
    address: PAYMESH_CONTRACT_ADDRESS,
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

// Utility function to perform contract write operations
export function useContractWriteUtility(
  functionName: string,
  args: any[],
  abi: Abi
) {
  const { contract } = useContract({ abi, address: PAYMESH_CONTRACT_ADDRESS });

  const calls = useMemo(() => {
    if (
      !contract ||
      !args ||
      args.some(
        (arg) => arg === undefined || arg === null || arg === "0x" || arg === ""
      )
    ) {
      return undefined;
    }

    return [contract.populate(functionName, args)];
  }, [contract, functionName, args]);

  const {
    send: writeAsync,
    data: writeData,
    isPending: writeIsPending,
  } = useSendTransaction({ calls });

  const {
    isLoading: waitIsLoading,
    data: waitData,
    status: waitStatus,
    isError: waitIsError,
    error: waitError,
  } = useTransactionReceipt({
    hash: writeData?.transaction_hash,
    watch: true,
  });

  return {
    writeAsync,
    writeData,
    writeIsPending,
    waitIsLoading,
    waitData,
    waitStatus,
    waitIsError,
    waitError,
    calls,
  };
}