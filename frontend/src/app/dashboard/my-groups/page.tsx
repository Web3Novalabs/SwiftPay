"use client"
import { Search, Users, Calendar, Plus, LucideUsers, Loader2 } from "lucide-react";
import React, { useMemo, useEffect } from "react";
import { Sofia_Sans } from "next/font/google";
import { useAccount } from "@starknet-react/core";
// import { SWIFTSWAP_ABI } from "@/abi/swiftswap_abi";

const sofiaSans = Sofia_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gt-walsheim-trial",
});

const mockGroups = [
  {
    id: 1,
    name: "TheBuidl Hackathon",
    role: "Creator",
    members: 5,
    dateCreated: "29th - 08 - 2025",
    isCreator: true
  },
  {
    id: 2,
    name: "TheBuidl Hackathon",
    role: "Member",
    members: 5,
    dateCreated: "29th - 08 - 2025",
    isCreator: false
  },
  {
    id: 3,
    name: "TheBuidl Hackathon",
    role: "Creator",
    members: 5,
    dateCreated: "29th - 08 - 2025",
    isCreator: true
  },
  {
    id: 4,
    name: "Innovate Summit",
    role: "Member",
    members: 5,
    dateCreated: "15th - 09 - 2025",
    isCreator: false
  },
  {
    id: 5,
    name: "Tech Fest 2025",
    role: "Member",
    members: 5,
    dateCreated: "22nd - 10 - 2025",
    isCreator: false
  }
];

const MyGroupsPage = () => {
  const totalGroups = mockGroups.length;
  const groupsCreated = mockGroups.filter(group => group.isCreator).length;

  const { account, address } = useAccount();

  // const {
  //   readData: groupSharesData,
  //   readIsLoading: groupSharesLoading,
  //   readError: groupSharesError,
  // } = useContractFetch(
  //   SWIFTSWAP_ABI,
  //   "group_address_has_shares_in",
  //   address ? [address] : []
  // );

  // useEffect(() => {
  //   if (account && groupSharesData) {
  //     if (Array.isArray(groupSharesData)) {
  //       groupSharesData.forEach((group, idx) => {
  //         console.log(`Group #${idx}:`, group);
  //       });
  //     } else {
  //       console.log("Group shares data:", groupSharesData);
  //     }
  //   }
  //   if (groupSharesError) {
  //     console.error("Error fetching group shares:", groupSharesError);
  //   }
  // }, [account, groupSharesData, groupSharesError]);

  const groupSharesLoading = true;
  
  return (
    <div className="min-h-screen text-white p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My groups</h1>
        <p className="text-gray-300 text-lg">Filter between all, cleared and pending</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative">
          <select 
            className="bg-none border border-gray-600 px-4 py-3 pr-10 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            defaultValue="all"
          >
            <option value="all">All</option>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search group by name.."
            className=" bg-none border border-gray-600 pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col w-fit h-fit sm:flex-row gap-6 mb-8">
        <div className="bg-[#2A2D35] px-6 py-3 flex items-center gap-4">
          <LucideUsers className="w-6 h-6 text-white" />
          <div>
            {groupSharesLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <p className="text-gray-300">Loading...</p>
              </div>
            ) : (
              <p className="text-gray-300">Total Groups - <b className="text-white">{totalGroups}</b> </p>
            )}
          </div>
        </div>

        <div className="bg-[#2A2D35] px-6 flex items-center gap-4">
          <Plus className="w-6 h-6 text-white" />
          <div>
            {groupSharesLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <p className="text-gray-300">Loading...</p>
              </div>
            ) : (
              <p className="text-gray-300">Groups Created - <b className="text-white">{groupsCreated}</b> </p>
            )}
          </div>
        </div>
      </div>

      {groupSharesLoading ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${sofiaSans.className}`}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="bg-[#2A2D35] border-none text-sm p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 bg-gray-600 rounded w-32"></div>
                <div className="h-6 bg-gray-600 rounded w-20"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-600 rounded w-24"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-600 rounded w-28"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-600 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${sofiaSans.className}`}>
          {mockGroups.map((group) => (
            <div key={group.id} className="bg-[#2A2D35] border-none text-sm p-6 hover:border-gray-800 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                <span className={`px-3 py-1 text-sm rounded-sm font-medium ${
                  group.isCreator 
                    ? 'bg-[#10273E] text-[#0073E6]' 
                    : 'bg-[#103E3A] text-[#00E69D]'
                }`}>
                  {group.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="space-y-3 mb-6 text-[12px]">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>Members | <b className="text-white"> {group.members} </b> </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>Date Created | <b className="text-white"> {group.dateCreated} </b> </span>
                  </div>
                </div>
                
                <button className="text-white border border-gray-800 rounded-sm bg-[#4C4C4C] h-fit text-sm py-2 px-3">
                  View Group
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGroupsPage;
