"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useNetwork,
  useBalance,
  useContract,
  useSendTransaction,
  useTransactionReceipt,
  usePaymasterEstimateFees,
  usePaymasterSendTransaction,
} from "@starknet-react/core";
import { sepolia } from "@starknet-react/chains";
import { useContractInteraction } from "../../hooks/useContractInteraction";
// import { SWIFTPAY_CONTRACT_ADDRESS, writeContractWithStarknetJs } from "@/hooks/useBlockchain";
import { SWIFTSWAP_ABI } from "@/abi/swiftswap_abi";
import {
  byteArray,
  cairo,
  Call,
  CallData,
  Contract,
  FeeMode,
  PaymasterDetails,
} from "starknet";
import { myProvider } from "@/utils/contract";
import QRCode from "react-qr-code";
import { STRK_ABI } from "@/abi/strk_abi";
import { useCallback } from "react";

export const OLD_CONTRACT_ADDRESS =
  "0x057500f7e000dafe7350eee771b791a4d885db920539e741f96410e42809a68d";
  export const SWIFTPAY_CONTRACT_ADDRESS =
    "0x02cc3107900daff156c0888eccbcd901500f9bf440ab694e1eecc14f4641d1dc";
  
    // export const SWIFTPAY_CONTRACT_ADDRESS =
    //   "0x0319c0feb56d2352681e58efc8aefa12efe0389b020efdcf7b822971a999f8c2";
  

export const STRK_SEPOLIA =
  "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const USDC_SEPOLIA =
  "0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080";
export const ETH_SEPOLIA =
  "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

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

  const { createGroup, isCreatingGroup } = useContractInteraction();

  const [formData, setFormData] = useState<CreateGroupFormData>({
    name: "HACKHATHON FUND",
    amount: "50000",
    tokenAddress:
      "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    members: [
      {
        addr: "0x05a99911249cD55eF49B196E0f380AC086C6f3b2459adb8E9A33Ae8610e1C7Ed",
        percentage: 20,
      },
      {
        addr: "0x0305b969b430721cda31852d669cdc23b2e4cfc889ab0ed855f5c70ca2668e0a",
        percentage: 80,
      },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groupAddress, setGroupAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [groupBalance, setGroupBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const [calls, setCalls] = useState<Call[] | undefined>(undefined);
  const [shouldSend, setShouldSend] = useState(false);

  const { data: balance } = useBalance({
    token:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as `0x${string}`,
    address: groupAddress as `0x${string}`,
  });
  const strkTokenAddress =
    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
  console.log("balance in usebalance XXXXXXXXXXX______", balance);

  const [resultHash, setResultHash] = useState("");

  const { data, error } = useTransactionReceipt({
    hash: resultHash,
  });

  // Fetch group balance
  const fetchGroupBalance = async (groupAddr: string) => {
    if (!groupAddr) return;

    setIsLoadingBalance(true);
    try {
      // STRK token address on Sepolia

      // Create a contract instance for the STRK token
      const strkContract = new Contract(
        [
          {
            name: "balanceOf",
            type: "function",
            inputs: [{ name: "account", type: "felt" }],
            outputs: [{ name: "balance", type: "Uint256" }],
            state_mutability: "view",
          },
        ],
        strkTokenAddress,
        myProvider
      );

      // Call balanceOf function
      const result = await strkContract.balanceOf(groupAddr);
      console.log("result in full_______", result);
      const balanceValue = result.balance;

      console.log("balanceValue______", balanceValue);

      const balanceInStrk =
        parseFloat(balanceValue.toString()) / Math.pow(10, 18);
      setGroupBalance(balanceInStrk.toFixed(4));
    } catch (error) {
      console.error("Error fetching group balance:", error);
      setGroupBalance("Error");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    console.log(data, error);
    let m;
    if (!data) return;
    if (
      data.value &&
      typeof data.value === "object" &&
      "events" in data.value &&
      Array.isArray((data.value as any).events)
    ) {
      m = (data.value as any).events[3]?.data[0];
      m = m.replace("0x", "0x0");
      setGroupAddress(m);
      setIsSuccess(true);
      // Fetch balance when group address is set
      fetchGroupBalance(m);
    } else {
      m = undefined;
    }
    console.log(m);
  }, [data, error]);

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
      const amount = parseFloat(formData.amount);

      if (account != undefined) {
        const swiftpayCall = {
          contractAddress: SWIFTPAY_CONTRACT_ADDRESS,
          entrypoint: "create_group",
          calldata: CallData.compile({
            name: byteArray.byteArrayFromString(formData.name),
            members: formData.members,
            token_address: formData.tokenAddress,
            usage_count:cairo.uint256(1),
          }),
        };

        const approveCall = {
          contractAddress: strkTokenAddress,
          entrypoint: "approve",
          calldata: [
            SWIFTPAY_CONTRACT_ADDRESS, // spender
            "1000000000000000000", // amount (1 STRK in wei)
            "0",
          ],
        };

        const multicallData = [approveCall, swiftpayCall];
        // const result = await account.execute(multicallData)

        const feeDetails: PaymasterDetails = {
          feeMode: {
            mode: "sponsored",
          },
        };

        const feeEstimation = await account?.estimatePaymasterTransactionFee(
          [...multicallData],
          feeDetails
        );

        const result = await account?.executePaymasterTransaction(
          [...multicallData],
          feeDetails,
          feeEstimation?.suggested_max_fee_in_gas_token
        );

        const status = await myProvider.waitForTransaction(
          result?.transaction_hash as string
        );

        console.log(result);

        setResultHash(result.transaction_hash);
        console.log(status);
      }


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

  // Copy address to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(groupAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Reset form and success state
  const resetForm = () => {
    setIsSuccess(false);
    setGroupAddress("");
    setGroupBalance("0");
    setFormData({
      name: "HACKHATHON FUND",
      amount: "50000",
      tokenAddress:
        "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      members: [
        {
          addr: "0x05a99911249cD55eF49B196E0f380AC086C6f3b2459adb8E9A33Ae8610e1C7Ed",
          percentage: 40,
        },
        {
          addr: "0x0305b969b430721cda31852d669cdc23b2e4cfc889ab0ed855f5c70ca2668e0a",
          percentage: 60,
        },
      ],
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {isSuccess ? (
        // Success State with QR Code and Copy Address
        <div className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Group Created Successfully!
            </h1>
            <p className="text-gray-600">
              Your group has been created on the blockchain. Here&apos;s the
              group address:
            </p>
          </div>

          {/* Group Address Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={groupAddress}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  copySuccess
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copySuccess ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Group Balance Display */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Group Balance
            </h3>
            <div className="flex items-center justify-center gap-2">
              {isLoadingBalance ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">
                    Loading balance...
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {groupBalance} STRK
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Current STRK balance in the group
                  </p>
                </div>
              )}
            </div>

            {/* Commented out ETH and USD balance displays */}
            {/*
            <div className="mt-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>ETH: 0.0000 Ξ</span>
                <span>USD: $0.00</span>
                <span>STRK: {groupBalance}</span>
              </div>
            </div>
            */}
          </div>

          {/* QR Code */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              QR Code
            </h2>
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCode value={groupAddress} size={200} level="H" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Scan this QR code to get the group address
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Another Group
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://sepolia.starkscan.co/contract/${groupAddress}`,
                  "_blank"
                )
              }
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              View on Starkscan
            </button>
          </div>
        </div>
      ) : (
        // Original Form
        <>
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
                    <span className="font-medium">
                      {chain?.name || "Unknown"}
                    </span>
                  </p>
                  {balance && (
                    <p className="text-sm text-blue-600 mt-1">
                      Balance:{" "}
                      <span className="font-medium">
                        {parseFloat(balance.formatted).toFixed(4)}{" "}
                        {balance.symbol}
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
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
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
                  <p className="mt-1 text-sm text-red-600">
                    {errors.tokenAddress}
                  </p>
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
                      totalPercentage === 100
                        ? "text-green-600"
                        : "text-red-600"
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
        </>
      )}
    </div>
  );
}
