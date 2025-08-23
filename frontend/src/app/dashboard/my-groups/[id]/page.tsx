"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  X,
  Copy,
  Check,
  ArrowLeft,
  LucideUsers,
  Plus,
  Search,
  ListPlus,
} from "lucide-react";
import { Sofia_Sans } from "next/font/google";
import { Group } from "@/types/group";
import { GroupService } from "@/services/groupService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";

const sofiaSans = Sofia_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gt-walsheim-trial",
});

// Mock data structure - replace with actual API calls
const mockGroupData: Group = {
  id: 1,
  name: "TheBuidl Hackathon",
  members: 5,
  dateCreated: "29th - 08 - 2025",
  totalAmount: "$1,000",
  groupAddress: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9aB2cF4B1fF7e",
  role: "Creator",
  isCreator: true,
  membersList: [
    {
      id: 1,
      address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9aB2cF4B1fF7e",
      type: "Equal",
      percentage: 20,
      amount: "$200",
      date: "27th-Aug-2025",
      status: "Paid",
    },
    {
      id: 2,
      address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9aB2cF4B1fF7e",
      type: "Equal",
      percentage: 20,
      amount: "$200",
      date: "27th-Aug-2025",
      status: "Paid",
    },
    {
      id: 3,
      address: "0x6B8e6d5B3A4F3E9bF7dC4D6aB2bF4aB2cF4B1fF7e",
      type: "Equal",
      percentage: 20,
      amount: "$200",
      date: "15th-Sep-2025",
      status: "Paid",
    },
    {
      id: 4,
      address: "0x7A1e9e2C6aA3D6bF2fE5D2cF4B1fF7eaB2cF4B1fF7e",
      type: "Equal",
      percentage: 20,
      amount: "$200",
      date: "10th-Oct-2025",
      status: "Paid",
    },
    {
      id: 5,
      address: "0xAD5e7bD4aF1c3E8A2fB6D8eE3c1F5baB2cF4B1fF7e",
      type: "Equal",
      percentage: 20,
      amount: "$200",
      date: "5th-Jan-2026",
      status: "Paid",
    },
  ],
};

const GroupDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [groupData, setGroupData] = useState<Group | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!params.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call when backend is ready
        // const data = await GroupService.getGroupDetails(Number(params.id));
        // setGroupData(data);

        // For now, using mock data
        setTimeout(() => {
          setGroupData(mockGroupData);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching group data:", error);
        setError("Failed to load group details");
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [params.id]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleEditGroup = () => {
    // TODO: Navigate to edit group page or open edit modal
    // router.push(`/dashboard/my-groups/${params.id}/edit`);
    console.log("Edit group clicked");
  };

  const handleSplitFunds = () => {
    // TODO: Navigate to split funds page or open split modal
    // router.push(`/dashboard/my-groups/${params.id}/split-funds`);
    console.log("Split funds clicked");
  };

  const handleBackToGroups = () => {
    router.push("/dashboard/my-groups");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-white" />
          </div>
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/my-groups")}
            className="bg-[#434672] hover:bg-[#5a5f8a] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="min-h-screen text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 text-lg">Group not found</p>
          <button
            onClick={() => router.push("/dashboard/my-groups")}
            className="bg-[#434672] hover:bg-[#5a5f8a] text-white px-4 py-2 rounded-lg transition-colors mt-4"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white mb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My groups</h1>
        <p className="text-gray-300 text-lg">
          Filter between all, cleared and pending
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative">
          <Select>
            <SelectTrigger className="w-full bg-[#FFFFFF0D] border py-4 sm:py-6 px-3 sm:px-4 rounded-sm border-[#FFFFFF0D] text-[#8398AD] !text-sm sm:!text-base">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2937] border border-[#FFFFFF0D] w-full">
              <SelectGroup>
                <SelectLabel className="text-[#E2E2E2]">Tokens</SelectLabel>
                <SelectItem
                  value="strk"
                  className="text-[#8398AD] hover:bg-[#374151]"
                >
                  ALL
                </SelectItem>
                <SelectItem
                  value="eth"
                  className="text-[#8398AD] hover:bg-[#374151]"
                >
                  CLEARED
                </SelectItem>
                <SelectItem
                  value="usdc"
                  className="text-[#8398AD] hover:bg-[#374151]"
                >
                  PENDING
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search group by name.."
            className=" bg-none border rounded-sm border-gray-600 pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col w-fit h-fit sm:flex-row gap-6 mb-8">
        <div className="bg-[#2A2D35] rounded-sm px-6 py-3 flex items-center gap-2">
          <LucideUsers className="w-6 h-6 text-white" />
          <div>
            <p className="text-gray-300">
              Total Groups - <b className="text-white">4</b>{" "}
            </p>
          </div>
        </div>

        <div className="bg-[#2A2D35] rounded-sm px-6 flex items-center gap-2">
          <ListPlus className="w-6 h-6 text-white" />
          <div>
            <p className="text-gray-300">
              Groups Created - <b className="text-white">2</b>{" "}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBackToGroups}
          className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Groups</span>
        </button>

        <div className="flex items-center gap-2"></div>
      </div>

      {/* Members Table */}
      <div className="bg-[#ffffff0d] rounded-sm overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <div className="flex items-center justify-between p-4 border-b border-[#20232bac]">
            <div className="flex items-center gap-2">
              <h1 className="border-r pr-2 border-[#FFFFFF0D]">
                {groupData.name}
              </h1>
              <h3 className="text-[#379A83]">Subscription Usage: 1/2</h3>
            </div>
            <X className="w-5 h-5" />
          </div>

          <div className="flex items-center justify-between p-4 border-b border-[#20232bb6]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="border-r pr-2 border-[#FFFFFF0D] text-[#8398AD] flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members
                </h1>
                <h3 className="text-[#E2E2E2]">5</h3>
              </div>

              <div className="flex items-center gap-2">
                <h1 className="border-r pr-2 border-[#FFFFFF0D] text-[#8398AD] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Created
                </h1>
                <h3 className="text-[#E2E2E2]">29th - 08 - 2025</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="border-gradient-flow cursor-pointer text-white px-4 py-2 rounded-sm transition-colors">
                Edit Group
              </button>
              <button className="border-gradient-flow cursor-pointer text-white px-4 py-2 rounded-sm transition-colors">
                Split Funds
              </button>
              <div className="border-gradient-flow space-x-2.5 text-white px-4 py-2 rounded-sm transition-colors">
                <span className="text-[#8398AD]">Balance:</span>
                <span className="text-[#E2E2E2]">0.000 STRK</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h1>Members</h1>
          </div>

          <table className="w-full">
            <thead className="bg-[#FFFFFF0D]">
              <tr>
                <th className="text-left p-4 text-gray-300 text-sm font-medium">
                  S/N
                </th>
                <th className="text-left p-4 text-gray-300 text-sm font-medium">
                  Beneficiary Address
                </th>
                <th className="text-left p-4 text-gray-300 text-sm font-medium">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody>
              {groupData.membersList.map((member, index) => (
                <tr
                  key={member.id}
                  className="border-b border-[#FFFFFF0D] hover:bg-[#3a3d45] transition-colors"
                >
                  <td className="p-4 text-white text-sm">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-mono">
                        {member.address.slice(0, 20)}...
                        {member.address.slice(-8)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(member.address)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copySuccess ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-white text-sm">
                    {member.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3 p-4">
          {groupData.membersList.map((member, index) => (
            <div
              key={member.id}
              className="bg-[#1a1d25] p-4 rounded-lg border border-gray-600"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-white font-semibold">#{index + 1}</span>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    member.status === "Paid"
                      ? "bg-[#103E3A] text-[#00E69D]"
                      : "bg-[#3A103E] text-[#E69D00]"
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-xs">
                      {member.address.slice(0, 12)}...{member.address.slice(-8)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(member.address)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copySuccess ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Type:</span>
                  <span className="px-2 py-1 bg-[#103E3A] text-[#00E69D] text-xs rounded">
                    {member.type}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Percentage:</span>
                  <span className="text-white">{member.percentage}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-white font-semibold">
                    {member.amount}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Date:</span>
                  <span className="text-gray-300">{member.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsPage;
