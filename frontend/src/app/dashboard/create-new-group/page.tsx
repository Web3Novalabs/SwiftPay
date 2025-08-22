import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import group1icon from "../../../../public/PlusCircle.svg";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import group4icon from "../../../../public/UsersFour.svg";

const CreateNewGroup = () => {
  const groupData = {
    name: "Paymesh",
    totalMembers: 5,
    members: [
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
      {
        address: "0x4A7d5cB67eA4F6e4B7cC3B3aE3f8fD9bB2cF9a1B",
        percentage: 20,
      },
    ],
  };

  return (
    <div className="px-0 sm:px-4 md:px-0">
      <div className="space-y-2 border-b border-[#FFFFFF0D] pb-8">
        <h1 className="text-[#DFDFE0] text-lg sm:text-xl font-semibold">
          Create new group
        </h1>
        <p className="text-[#8398AD] text-sm sm:text-base">
          Create and manage your groups
        </p>
      </div>

      <div className="mt-8 sm:mt-10">
        <h2 className="text-[#E2E2E2] text-base sm:text-lg pb-3 sm:pb-5 font-semibold">
          Group Details
        </h2>
        <p className="text-[#E2E2E2] text-sm sm:text-base">Group Name</p>
        <Input
          placeholder="Enter Group Name"
          className="mt-2 py-4 sm:py-6 px-3 sm:px-4 rounded-sm bg-[#FFFFFF0D] border border-[#FFFFFF0D] text-[#8398AD] !text-sm sm:!text-base"
        />
      </div>

      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 w-full">
        <div className="w-full sm:w-1/2">
          <h2 className="text-[#E2E2E2] text-base sm:text-lg pb-3 sm:pb-5 font-semibold">
            Expected token
          </h2>

          <Select>
            <SelectTrigger className="w-full bg-[#FFFFFF0D] border py-4 sm:py-6 px-3 sm:px-4 rounded-sm border-[#FFFFFF0D] text-[#8398AD] !text-sm sm:!text-base">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2937] border border-[#FFFFFF0D] w-full">
              <SelectGroup>
                <SelectLabel className="text-[#E2E2E2]">Tokens</SelectLabel>
                <SelectItem
                  value="strk"
                  className="text-[#8398AD] hover:bg-[#374151]"
                >
                  STRK
                </SelectItem>
                <SelectItem
                  value="eth"
                  className="text-[#8398AD] hover:bg-[#374151]"
                >
                  ETH
                </SelectItem>
                <SelectItem
                  value="usdc"
                  className="text-[#8398AD] hover:bg-[#374151]"
                >
                  USDC
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-1/2">
          <h2 className="text-[#E2E2E2] text-base sm:text-lg pb-3 sm:pb-5 font-semibold">
            Percentage Type
          </h2>

          <Select>
            <SelectTrigger className="w-full bg-[#FFFFFF0D] border py-4 sm:py-6 px-3 sm:px-4 rounded-sm border-[#FFFFFF0D] text-[#8398AD] !text-sm sm:!text-base">
              <SelectValue placeholder="Select percentage type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2937] border border-[#FFFFFF0D] w-full">
              <SelectItem
                value="percentage"
                className="text-[#8398AD] hover:bg-[#374151]"
              >
                Percentage
              </SelectItem>
              <SelectItem
                value="fixed"
                className="text-[#8398AD] hover:bg-[#374151]"
              >
                Fixed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 sm:mt-10">
        <h2 className="text-[#E2E2E2] text-base sm:text-lg pb-3 sm:pb-5 font-semibold">
          Members configuration
        </h2>

        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <div className="w-full sm:w-[75%]">
            <p className="text-[#E2E2E2] text-sm sm:text-base">
              Wallet address
            </p>
            <Input
              placeholder="Enter wallet address"
              className="mt-2 py-4 sm:py-6 px-3 sm:px-4 rounded-sm bg-[#FFFFFF0D] border border-[#FFFFFF0D] text-[#8398AD] !text-sm sm:!text-base"
            />
          </div>

          <div className="w-full sm:w-[25%]">
            <p className="text-[#E2E2E2] text-sm sm:text-base">
              Enter Percentage
            </p>
            <Input
              type="number"
              placeholder="Enter percentage"
              className="mt-2 py-4 sm:py-6 px-3 sm:px-4 rounded-sm bg-[#FFFFFF0D] border border-[#FFFFFF0D] text-[#8398AD] !text-sm sm:!text-base"
            />
          </div>
        </div>

        <div className="mt-8 sm:mt-10 w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Total Percentage Display */}
          <div className="w-full sm:w-[75%]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[#E2E2E2] text-xs sm:text-[15px]">
                Total percentage must equal
              </p>
              <p className="text-[#E2E2E2] text-xs sm:text-[15px]">
                0% of 100%
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#374151] rounded-full h-2">
              <div
                className="bg-[#8B5CF6] h-2 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>

          <div className="w-full sm:w-[25%]">
            <button className="mt-2 py-3 px-4 w-full border-gradient rounded-sm bg-[#FFFFFF0D] text-[#E2E2E2] flex items-center justify-center gap-2 hover:bg-opacity-10 transition-colors cursor-pointer">
              <span>
                <Image
                  src={group1icon}
                  alt="icon"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                />
              </span>
              <span className="text-[#E2E2E2] text-sm sm:text-base">
                Add Member
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Usage section */}
      <div className="mt-8 border-t border-[#FFFFFF0D] pt-10 sm:mt-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Usage section left side */}
        <div className="w-full">
          <h2 className="text-[#E2E2E2] text-lg sm:text-xl pb-3 sm:pb-5 font-semibold">
            Usage
          </h2>
          <p className="text-[#E2E2E2] text-sm sm:text-base">
            Number of Planned Uses
          </p>
          <Input
            type="number"
            placeholder="Enter number of uses"
            className="mt-2 py-4 sm:py-6 px-3 sm:px-4 w-full rounded-sm bg-[#FFFFFF0D] border border-[#FFFFFF0D] text-[#8398AD] !text-sm sm:!text-base"
          />

          <div className="mt-8 sm:mt-10 bg-[#FFFFFF0D] p-4 sm:p-5 rounded-sm">
            <h1 className="text-[#E2E2E2] text-sm sm:text-base pb-3 sm:pb-5 font-semibold">
              Cost Calculation
            </h1>
            <div className="flex items-center justify-between">
              <h3 className="text-[#8398AD] text-sm sm:text-base font-semibold">
                Cost per use:
              </h3>
              <p className="text-[#E2E2E2] text-base sm:text-lg font-bold">
                $1.00
              </p>
            </div>

            <div className="flex items-center py-3 sm:py-5 border-b border-[#FFFFFF0D] justify-between">
              <h3 className="text-[#8398AD] text-sm sm:text-base font-semibold">
                Number of uses:
              </h3>
              <p className="text-[#E2E2E2] text-base sm:text-lg font-bold">2</p>
            </div>

            <div className="flex items-center pt-3 sm:pt-5 justify-between">
              <h3 className="text-[#8398AD] text-sm sm:text-base font-semibold">
                Total cost:
              </h3>
              <p className="text-[#E2E2E2] text-base sm:text-lg font-bold">
                $2.00
              </p>
            </div>
          </div>
        </div>

        {/* Review section right side */}
        <div className="w-full bg-[#FFFFFF0D] p-4 sm:p-5 rounded-sm border border-[#FFFFFF0D] h-[300px] sm:h-[400px] flex flex-col">
          <h2 className="text-[#E2E2E2] text-lg sm:text-xl pb-3 sm:pb-5 font-semibold">
            Review
          </h2>

          {/* Group Information */}
          <div className="space-y-2 mb-4 sm:mb-6 bg-[#FFFFFF0D] p-1.5 rounded-sm border border-[#FFFFFF0D]">
            <div className="flex items-center justify-between">
              <span className="text-[#8398AD] text-sm sm:text-base font-semibold">
                Group Name:
              </span>
              <span className="text-[#8398AD] text-sm sm:text-base font-semibold">
                Total Members:
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#E2E2E2] text-sm sm:text-base">
                {groupData.name}
              </span>
              <span className="text-[#E2E2E2] text-sm sm:text-base">
                {groupData.totalMembers}
              </span>
            </div>
          </div>

          {/* Member Details - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-2">
            {groupData.members.map((member, index) => (
              <div key={index} className="border-b border-[#FFFFFF0D] pb-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8398AD] text-sm sm:text-base font-semibold">
                    Wallet address:
                  </span>
                  <span className="text-[#8398AD] text-sm sm:text-base font-semibold">
                    Percentage:
                  </span>
                </div>
                <div className="flex items-center text-left justify-between">
                  <span className="text-[#E2E2E2] text-xs sm:text-base">
                    {member.address}
                  </span>
                  <span className="text-[#E2E2E2] text-left text-xs sm:text-base">
                    {member.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="mt-8 sm:mt-10 w-full border-t border-[#FFFFFF0D] pt-8 pb-16">
        <h2 className="text-[#E2E2E2] text-lg sm:text-xl pb-3 sm:pb-5 font-semibold">
          Confirmation
        </h2>

        {/* Checkbox */}
        <div className="bg-[#FFFFFF0D] p-3 sm:p-4 rounded-sm border border-[#FFFFFF0D] mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-[#434672] to-[#755a5a] cursor-pointer rounded-full flex items-center justify-center">
              <Checkbox className="!rounded-full h-4 w-4 sm:h-5 sm:w-5 cursor-pointer" />
            </span>
            <span className="text-[#E2E2E2] text-sm sm:text-base">
              By checking I accept the creation fee and confirm members and
              percentages are correct.
            </span>
          </div>
        </div>

        {/* Create Group Button */}
        <button className="w-full sm:w-fit cursor-pointer bg-[#FFFFFF0D] border border-[#FFFFFF0D] text-[#E2E2E2] py-3 sm:py-4 px-6 sm:px-12 rounded-sm flex items-center justify-center gap-2 sm:gap-3 hover:bg-[#282e38] transition-colors">
          <div className="flex items-center justify-center">
            <Image
              src={group4icon}
              alt="icon"
              className="h-5 w-5 sm:h-6 sm:w-6"
            />
          </div>
          <span className="text-[#E2E2E2] text-base sm:text-lg font-semibold">
            Create Group
          </span>
        </button>
      </div>
    </div>
  );
};

export default CreateNewGroup;
