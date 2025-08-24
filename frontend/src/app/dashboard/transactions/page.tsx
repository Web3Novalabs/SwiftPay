"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {  useGetAllGroups, } from "@/hooks/useContractInteraction";
import WalletConnect from "@/app/components/WalletConnect";
import { useAccount } from "@starknet-react/core";

// Sample transaction data
const transactionData = [
  {
    id: 1,
    groupAddress: "0x6B8e6d5B3A4F3E9bF7dC4D6aB2bF4D6B3A4D7cF3",
    amount: "$120",
    date: "27th-Aug-2025",
    status: "Paid",
  },
  {
    id: 2,
    groupAddress: "0x7E8f6D6F4C5E4D7B3A8C7E5B8A9D8C6F6A5D4A1",
    amount: "$250",
    date: "15th-Sep-2025",
    status: "In progress",
  },
  {
    id: 3,
    groupAddress: "0x4C6B8D5E2F3A6D7B8C8D9E5A1B2F9C4E3A5D7B8",
    amount: "$90",
    date: "2nd-Oct-2025",
    status: "Paid",
  },
  {
    id: 4,
    groupAddress: "0x9D2E7F8A1B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7",
    amount: "$300",
    date: "12th-Nov-2025",
    status: "In progress",
  },
  {
    id: 5,
    groupAddress: "0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0",
    amount: "$450",
    date: "31st-Jan-2026",
    status: "Paid",
  },
  {
    id: 6,
    groupAddress: "0x2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1",
    amount: "$220",
    date: "5th-Mar-2026",
    status: "In progress",
  },
  {
    id: 7,
    groupAddress: "0x3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2",
    amount: "$75",
    date: "21st-Apr-2026",
    status: "Paid",
  },
  {
    id: 8,
    groupAddress: "0x4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3",
    amount: "$600",
    date: "10th-Jun-2026",
    status: "In progress",
  },
  {
    id: 9,
    groupAddress: "0x5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4",
    amount: "$150",
    date: "15th-Jul-2026",
    status: "In progress",
  },
  {
    id: 10,
    groupAddress: "0x6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5",
    amount: "$380",
    date: "28th-Aug-2026",
    status: "Paid",
  },
  {
    id: 11,
    groupAddress: "0x6B8e6d5B3A4F3E9bF7dC4D6aB2bF4D6B3A4D7cF3",
    amount: "$120",
    date: "27th-Aug-2025",
    status: "Paid",
  },
  {
    id: 12,
    groupAddress: "0x7E8f6D6F4C5E4D7B3A8C7E5B8A9D8C6F6A5D4A1",
    amount: "$250",
    date: "15th-Sep-2025",
    status: "In progress",
  },
  {
    id: 13,
    groupAddress: "0x4C6B8D5E2F3A6D7B8C8D9E5A1B2F9C4E3A5D7B8",
    amount: "$90",
    date: "2nd-Oct-2025",
    status: "Paid",
  },
  {
    id: 14,
    groupAddress: "0x9D2E7F8A1B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7",
    amount: "$300",
    date: "12th-Nov-2025",
    status: "In progress",
  },
  {
    id: 15,
    groupAddress: "0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0",
    amount: "$450",
    date: "31st-Jan-2026",
    status: "Paid",
  },
  {
    id: 16,
    groupAddress: "0x2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1",
    amount: "$220",
    date: "5th-Mar-2026",
    status: "In progress",
  },
  {
    id: 17,
    groupAddress: "0x3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2",
    amount: "$75",
    date: "21st-Apr-2026",
    status: "Paid",
  },
  {
    id: 18,
    groupAddress: "0x4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3",
    amount: "$600",
    date: "10th-Jun-2026",
    status: "In progress",
  },
  {
    id: 19,
    groupAddress: "0x5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4",
    amount: "$150",
    date: "15th-Jul-2026",
    status: "In progress",
  },
  {
    id: 20,
    groupAddress: "0x6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5",
    amount: "$380",
    date: "28th-Aug-2026",
    status: "Paid",
  },
];

const TransactionsPage = () => {
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions based on selected filter
  const filteredTransactions = transactionData.filter((transaction) => {
    if (filter === "all") return true;
    if (filter === "cleared") return transaction.status === "Paid";
    if (filter === "pending") return transaction.status === "In progress";
    return true;
  });

  const transaction = useGetAllGroups();
console.log(transaction)

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const { address } = useAccount();
  const isWalletConnected = !!address;

  if (!isWalletConnected) {
    return (
      <div className="min-h-[50vh] text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#434672] to-[#755a5a] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-300 mb-4">
            Please connect your wallet to view your groups
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#DFDFE0] mb-4">
            Transaction History
          </h1>

          {/* Filter Section */}
          <div className="flex flex-col items-start gap-4">
            <p className="text-[#8398AD] text-base">
              Filter between all, cleared and pending
            </p>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="sm:w-[278px] w-full bg-transparent py-4 sm:py-6 px-3 sm:px-4 rounded-sm text-[#8398AD] border border-[#FFFFFF0D]">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2937] border border-[#FFFFFF0D] w-full text-[#8398AD]">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transaction Table */}
        <div className=" rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FFFFFF0D] border-b border-[#FFFFFF0D]">
                <tr>
                  <th className="px-6 py-6 text-left text-xs font-medium text-[#8398AD] uppercase tracking-wider">
                    S/N
                  </th>
                  <th className="px-6 py-6   text-left text-xs font-medium text-[#8398AD] uppercase tracking-wider">
                    Group Address
                  </th>
                  <th className="px-6 py-6 text-left text-xs font-medium text-[#8398AD] uppercase tracking-wider">
                    Amount Recieved
                  </th>
                  <th className="px-6 py-6 text-left text-xs font-medium text-[#8398AD] uppercase tracking-wider">
                    Date
                  </th>
                  {/* <th className="px-6 py-6 text-left text-xs font-medium text-[#8398AD] uppercase tracking-wider">
                    Status
                  </th>*/}
                </tr>
              </thead>
              <tbody className="bg-[#FFFFFF0D] divide-y divide-[#FFFFFF0D]">
                {transaction &&
                  transaction.map((transaction, index) => (
                    <tr key={transaction.id} className="hover:bg-[#282e38]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#E2E2E2]">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E2E2E2] font-mono">
                        {transaction.groupAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#E2E2E2]">
                        {transaction.amount ? `STK ${transaction.amount.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E2E2E2]">
                        {transaction.date}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-6 py-4 whitespace-nowrap text-sm text-[#E2E2E2]">
                        {transaction.usage_limit_reached}
                      </span>
                    </td> */}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-16">
          <div className="text-sm text-[#E2E2E2]">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredTransactions.length)} of{" "}
            {filteredTransactions.length} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-[#E2E2E2] bg-[#FFFFFF0D] border border-[#FFFFFF0D] rounded-md hover:bg-[#282e38] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? "bg-gradient-to-r from-[#434672] to-[#755a5a] text-white"
                        : "text-[#E2E2E2] bg-[#FFFFFF0D] border border-[#FFFFFF0D] hover:bg-[#282e38]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-[#E2E2E2] bg-[#FFFFFF0D] border border-[#FFFFFF0D] rounded-md hover:bg-[#282e38] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
