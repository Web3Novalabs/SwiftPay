"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useNetwork, useBalance, useContract, useSendTransaction, useTransactionReceipt } from "@starknet-react/core";
import { sepolia } from "@starknet-react/chains";
import { useContractInteraction } from "../../hooks/useContractInteraction";
// import { SWIFTPAY_CONTRACT_ADDRESS, writeContractWithStarknetJs } from "@/hooks/useBlockchain";
import { SWIFTSWAP_ABI } from "@/abi/swiftswap_abi";
import { byteArray, cairo, CallData, Contract } from "starknet";
import { myProvider } from "@/utils/contract";

export const SWIFTPAY_CONTRACT_ADDRESS =
  "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d";

interface GroupMember {
  addr: string;
  percentage: number;
}

interface CreateGroupFormData {
  name: string;
  amount: string;
  tokenAddress: string;
  members: GroupMember[];
}

export default function CreateGroupForm() {
  const { address, account } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({
    token: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // ETH token address on Sepolia
  });
  const { createGroup, isCreatingGroup } = useContractInteraction();

  const [formData, setFormData] = useState<CreateGroupFormData>({
    name: "HACKHATHON FUND",
    amount: "50000",
    tokenAddress:
      "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    members: [
      {
        addr: "0x07f41EEB3F8691F20a86A414b5670862a8c470ECE32d018e5c2fb1038F1bF836",
        percentage: 40,
      },
      {
        addr: "0x0305b969b430721cda31852d669cdc23b2e4cfc889ab0ed855f5c70ca2668e0a",
        percentage: 60,
      },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { contract } = useContract({
    abi: SWIFTSWAP_ABI,
    address: SWIFTPAY_CONTRACT_ADDRESS,
  });

  // const {error,data,sendAsync,variables } = useSendTransaction({
  //   calls:
  //     contract && address
  //       ? [contract?.populate("create_group", [byteArray.byteArrayFromString(formData.name),
  //         formData.members,
  //         formData.tokenAddress,])]
  //       : undefined,
  // });
  // Contract Call Array

  const [resultHash,setResultHash] = useState("") 
  const calls = useMemo(() => {
    // Validate the input values before proceeding
    const isInputValid =
      formData.members && formData.name && formData.tokenAddress;
    if (!isInputValid) return [];

    const populatedCall = contract?.populateTransaction["create_group"](
      CallData.compile([
        byteArray.byteArrayFromString(formData.name),
        formData.members,
        formData.tokenAddress,
      ])
    );

    // Ensure calls is always an array or undefined
    return populatedCall ? [populatedCall] : undefined;
  }, [
    contract,
    formData.tokenAddress,
    formData.members,
    formData.name
  ]);

  const { data, error } = useTransactionReceipt({
    hash: resultHash,
  });

  console.log()

  useEffect(() => {
    console.log(data, error)
    let m 
    if (!data) return
    if (
      data.value &&
      typeof data.value === "object" &&
      "events" in data.value &&
      Array.isArray((data.value as any).events)
    ) {
      m = (data.value as any).events[2]?.data[0];
      m= m.replace("0x","0x0")
    } else {
      m = undefined;
    }
    console.log(m)
  },[data,error])
  // const {
  //      data: writeData,
  //   isPending: writeIsPending,
  //   sendAsync
  // } = useSendTransaction({
  //   calls,
  // });

  // const { isLoading: waitIsLoading, data: waitData } = useWaitForTransaction({
  //   hash: writeData?.transaction_hash,
  //   watch: true,
  // });
  // Calculate total percentage
  const totalPercentage = formData.members.reduce(
    (sum, member) => sum + member.percentage,
    0
  );

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    }

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    // Validate token address
    if (!formData.tokenAddress.trim()) {
      newErrors.tokenAddress = "Token address is required";
    } else if (!/^0x[a-fA-F0-9]{63}$/.test(formData.tokenAddress)) {
      newErrors.tokenAddress = "Invalid Starknet address format";
    }

    // Validate members
    if (formData.members.length < 2) {
      newErrors.members = "At least 2 members are required";
    }

    // Validate member addresses and percentages
    const seenAddresses = new Set<string>();
    formData.members.forEach((member, index) => {
      if (!member.addr.trim()) {
        newErrors[`member${index}Addr`] = "Address is required";
      } else if (!/^0x[a-fA-F0-9]{63}$/.test(member.addr)) {
        newErrors[`member${index}Addr`] = "Invalid Starknet address format";
      } else if (seenAddresses.has(member.addr)) {
        newErrors[`member${index}Addr`] = "Duplicate address";
      } else {
        seenAddresses.add(member.addr);
      }

      if (member.percentage <= 0 || member.percentage > 100) {
        newErrors[`member${index}Percentage`] =
          "Percentage must be between 1 and 100";
      }
    });

    // Validate total percentage
    if (totalPercentage !== 100) {
      newErrors.totalPercentage = `Total percentage must be 100% (currently ${totalPercentage}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!validateForm()) {
    //   return;
    // }

    setIsSubmitting(true);

    try {
      // Convert amount to wei (assuming 18 decimals) - handle large numbers properly
      const amount = parseFloat(formData.amount);
      const amountInWei = BigInt(Math.floor(amount * 1e18)).toString();

      // Prepare contract data
      const contractData = {
        name: formData.name,
        // amount: formData.amount,
        members: formData.members,
        tokenAddress: formData.tokenAddress,
      };

      // console.log("Creating group with contract data:", contractData);

      // // Call the contract
      // const result = await createGroup(contractData);
      // let m = cairo.isTypeArray
      // console.log(m)
      if (account != undefined) {
        // const data = Cont
        const result = await account.execute({
          contractAddress: SWIFTPAY_CONTRACT_ADDRESS,
          entrypoint: "create_group",
          calldata: CallData.compile({
            name: byteArray.byteArrayFromString(formData.name),
            // amount: cairo.uint256(Number(formData.amount)),
            members: formData.members,
            token_address: formData.tokenAddress,
          }),
        });
        // // let k = await myProvider.getAddressFromStarkName(result.transaction_hash)
        // // let m = await myProvider.getTransactionReceipt(result.transaction_hash);
        // let f = await myProvider.getTransactionReceipt(result.transaction_hash);
        result.transaction_hash;
        let fetchValue;
        // if (
        //   f.value &&
        //   typeof f.value === "object" &&
        //   "events" in f.value &&
        //   Array.isArray((f.value as any).events)
        // ) {
        //   fetchValue = (f.value as any).events[0]?.data[0];
        // } else {
        //   fetchValue = undefined;
        // }
        // console.log({
        //   // mait: k,
        //   // txd: m,
        //   fetch: fetchValue,
        //   m: f.statusReceipt
        // });
        // console.log(result)
        // await sendAsync();
        setResultHash(result.transaction_hash)
        // console.log({ writeData });
      }

      // alert(
      //   `Group created successfully! Transaction hash: ${result.transaction_hash}`
      // );

      // Reset form
      setFormData({
        name: "",
        amount: "",
        tokenAddress: "",
        members: [
          { addr: "", percentage: 0 },
          { addr: "", percentage: 0 },
        ],
      });
    } catch (error) {
      console.error("Error creating group:", error);
      alert(
        `Failed to create group: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new member
  const addMember = () => {
    setFormData((prev) => ({
      ...prev,
      members: [...prev.members, { addr: "", percentage: 0 }],
    }));
  };

  // Remove member
  const removeMember = (index: number) => {
    if (formData.members.length <= 2) return;

    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  // Update member
  const updateMember = (
    index: number,
    field: keyof GroupMember,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  // Auto-distribute percentages evenly
  const distributeEvenly = () => {
    const memberCount = formData.members.length;
    const percentagePerMember = Math.floor(100 / memberCount);
    const remainder = 100 % memberCount;

    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((member, index) => ({
        ...member,
        percentage: percentagePerMember + (index < remainder ? 1 : 0),
      })),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Group
        </h1>
        <p className="text-gray-600">
          Set up a new sharing group with members and their percentages
        </p>

        {/* Wallet Information */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">
                Connected Wallet:{" "}
                <span className="font-mono font-medium">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </p>
              <p className="text-sm text-blue-600">
                Network:{" "}
                <span className="font-medium">{chain?.name || "Unknown"}</span>
              </p>
              {balance && (
                <p className="text-sm text-blue-600 mt-1">
                  Balance:{" "}
                  <span className="font-medium">
                    {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </span>
                </p>
              )}
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                chain?.id === sepolia.id ? "bg-orange-500" : "bg-green-500"
              }`}
            ></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Group Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Group Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter group name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Total Amount *
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.0"
                step="0.000001"
                min="0"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="tokenAddress"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Token Contract Address *
            </label>
            <input
              type="text"
              id="tokenAddress"
              value={formData.tokenAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tokenAddress: e.target.value,
                }))
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.tokenAddress ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0x..."
            />
            {errors.tokenAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.tokenAddress}</p>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Group Members
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={distributeEvenly}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Distribute Evenly
              </button>
              <button
                type="button"
                onClick={addMember}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>

          {errors.members && (
            <p className="text-sm text-red-600 mb-4">{errors.members}</p>
          )}
          {errors.totalPercentage && (
            <p className="text-sm text-red-600 mb-4">
              {errors.totalPercentage}
            </p>
          )}

          <div className="space-y-4">
            {formData.members.map((member, index) => (
              <div
                key={index}
                className="flex gap-4 items-start p-4 bg-white rounded border"
              >
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member {index + 1} Address *
                  </label>
                  <input
                    type="text"
                    value={member.addr}
                    onChange={(e) =>
                      updateMember(index, "addr", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`member${index}Addr`]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0x..."
                  />
                  {errors[`member${index}Addr`] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[`member${index}Addr`]}
                    </p>
                  )}
                </div>

                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage *
                  </label>
                  <input
                    type="number"
                    value={member.percentage}
                    onChange={(e) =>
                      updateMember(
                        index,
                        "percentage",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`member${index}Percentage`]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="1"
                    max="100"
                  />
                  {errors[`member${index}Percentage`] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[`member${index}Percentage`]}
                    </p>
                  )}
                </div>

                {formData.members.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="mt-6 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total Percentage Display */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total Percentage:
              </span>
              <span
                className={`text-lg font-bold ${
                  totalPercentage === 100 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalPercentage}%
              </span>
            </div>
            {totalPercentage !== 100 && (
              <p className="text-sm text-red-600 mt-1">
                {totalPercentage < 100
                  ? `${100 - totalPercentage}% remaining`
                  : `${totalPercentage - 100}% over`}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              isSubmitting || isCreatingGroup || totalPercentage !== 100
            }
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isSubmitting || isCreatingGroup || totalPercentage !== 100
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSubmitting || isCreatingGroup ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isCreatingGroup
                  ? "Creating Group on Chain..."
                  : "Creating Group..."}
              </div>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
