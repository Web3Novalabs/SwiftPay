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
  // Sample data - replace with your actual form state
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
    <div className="">
      <div className="space-y-2">
        <h1 className="text-[#DFDFE0] text-xl font-semibold">
          Create new group
        </h1>
        <p className="text-[#8398AD] text-base">
          Create and manage your groups
        </p>
      </div>

      <div className="mt-10">
        <h2 className="text-[#E2E2E2] text-lg pb-5 font-semibold">
          Group Details
        </h2>
        <p className="text-[#E2E2E2] text-base">Group Name</p>
        <Input
          placeholder="Enter Group Name"
          className="mt-2 py-6 px-4 rounded-3xl bg-[#FFFFFF0D] border border-[#374151] text-[#8398AD] !text-base"
        />
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-start gap-6 w-full">
        <div className="w-full sm:w-1/2">
          <h2 className="text-[#E2E2E2] text-lg pb-5 font-semibold">
            Expecton token
          </h2>

          <Select>
            <SelectTrigger className="w-full bg-[#FFFFFF0D] border py-6 px-4 rounded-3xl border-[#374151] text-[#8398AD] !text-base">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2937] border border-[#374151] w-full">
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
          <h2 className="text-[#E2E2E2] text-lg pb-5 font-semibold">
            Percentage Type
          </h2>

          <Select>
            <SelectTrigger className="w-full bg-[#FFFFFF0D] border py-6 px-4 rounded-3xl border-[#374151] text-[#8398AD] !text-base">
              <SelectValue placeholder="Select percentage type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2937] border border-[#374151] w-full">
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

      <div className="mt-10">
        <h2 className="text-[#E2E2E2] text-lg pb-5 font-semibold">
          Members configuration
        </h2>

        <div className=" w-full flex items-center justify-center gap-6">
          <div className="w-[75%]">
            <p className="text-[#E2E2E2] text-base">Wallet address</p>
            <Input
              placeholder="Enter wallet address"
              className="mt-2 py-6 px-4 rounded-3xl bg-[#FFFFFF0D] border border-[#374151] text-[#8398AD] !text-base"
            />
          </div>

          <div className="w-[25%]">
            <p className="text-[#E2E2E2] text-base">Enter Percentage</p>
            <Input
              type="number"
              placeholder="Enter percentage"
              className="mt-2 py-6 px-4 rounded-3xl bg-[#FFFFFF0D] border border-[#374151] text-[#8398AD] !text-base"
            />
          </div>
        </div>

        <div className="mt-10 w-full flex items-center justify-center gap-6">
          {/* Total Percentage Display */}
          <div className=" w-[75%]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[#E2E2E2] text-[15px]">
                Total percentage must equal
              </p>
              <p className="text-[#E2E2E2] text-[15px]">0% of 100%</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#374151] rounded-full h-2">
              <div
                className="bg-[#8B5CF6] h-2 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>

          <div className="w-[25%]">
            <button className="mt-2 py-3 px-4 w-full border-gradient rounded-3xl bg-[#FFFFFF0D] text-[#E2E2E2] flex items-center justify-center gap-2 hover:bg-opacity-10 transition-colors cursor-pointer">
              <span>
                <Image src={group1icon} alt="icon" className="h-6 w-6" />
              </span>
              <span className="text-[#E2E2E2] text-base">Add Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Usage section */}
      <div className="mt-10 w-full grid grid-cols-2 gap-6">
        {/* Usage section left side */}
        <div className="w-full">
          <h2 className="text-[#E2E2E2] text-xl pb-5 font-semibold">Usage</h2>
          <p className="text-[#E2E2E2] text-base">Number of Planned Uses</p>
          <Input
            type="number"
            placeholder="Enter number of uses"
            className="mt-2 py-6 px-4 w-full rounded-3xl bg-[#FFFFFF0D] border border-[#374151] text-[#8398AD] !text-base"
          />

          <div className="mt-10 bg-[#FFFFFF0D] p-5 rounded-lg">
            <h1 className="text-[#E2E2E2] text-base pb-5 font-semibold">
              Cost Calculation
            </h1>
            <div className="flex items-center justify-between">
              <h3 className="text-[#8398AD] text-base font-semibold">
                Cost per use:
              </h3>
              <p className="text-[#E2E2E2] text-lg font-bold">$1.00</p>
            </div>

            <div className="flex items-center py-5 border-b border-[#374151] justify-between">
              <h3 className="text-[#8398AD] text-base font-semibold">
                Number of uses:
              </h3>
              <p className="text-[#E2E2E2] text-lg font-bold">2</p>
            </div>

            <div className="flex items-center pt-5 justify-between">
              <h3 className="text-[#8398AD] text-base font-semibold">
                Total cost:
              </h3>
              <p className="text-[#E2E2E2] text-lg font-bold">$2.00</p>
            </div>
          </div>
        </div>

        {/* Review section right side */}
        <div className="w-full bg-[#FFFFFF0D] p-5 rounded-lg border border-[#374151] h-[400px] flex flex-col">
          <h2 className="text-[#E2E2E2] text-xl pb-5 font-semibold">Review</h2>

          {/* Group Information */}
          <div className="space-y-2 mb-6 bg-[#FFFFFF0D] p-1.5 rounded-lg border border-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[#8398AD] text-base font-semibold">
                Group Name:
              </span>
              <span className="text-[#8398AD] text-base font-semibold">
                Total Members:
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#E2E2E2] text-base">{groupData.name}</span>
              <span className="text-[#E2E2E2] text-base">
                {groupData.totalMembers}
              </span>
            </div>
          </div>

          {/* Member Details - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {groupData.members.map((member, index) => (
              <div key={index} className="border-b border-[#374151] pb-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8398AD] text-base font-semibold">
                    Wallet address:
                  </span>
                  <span className="text-[#8398AD] text-base font-semibold">
                    Percentage:
                  </span>
                </div>
                <div className="flex items-center text-left justify-between">
                  <span className="text-[#E2E2E2] text-base">
                    {member.address}
                  </span>
                  <span className="text-[#E2E2E2] text-left text-base">
                    {member.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="mt-10 w-full">
        <h2 className="text-[#E2E2E2] text-xl pb-5 font-semibold">
          Confirmation
        </h2>

        {/* Checkbox */}
        <div className="bg-[#FFFFFF0D] p-4 rounded-lg border border-[#374151] mb-6">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-gradient-to-r from-[#434672] to-[#755a5a] cursor-pointer rounded-full flex items-center justify-center">
              <Checkbox className="!rounded-full h-5 w-5 cursor-pointer" />
            </span>
            <span className="text-[#E2E2E2] text-base">
              By checking I accept the creation fee and confirm members and
              percentages are correct.
            </span>
          </div>
        </div>

        {/* Create Group Button */}
        <button className="w-fit cursor-pointer bg-[#FFFFFF0D] border border-[#374151] text-[#E2E2E2] py-4 px-12 rounded-lg flex items-center justify-center gap-3 hover:bg-[#282e38] transition-colors">
          <div className=" flex items-center justify-center">
            <Image src={group4icon} alt="icon" className="h-6 w-6" />
          </div>
          <span className="text-[#E2E2E2] text-lg font-semibold">
            Create Group
          </span>
        </button>
      </div>
    </div>
  );
};

export default CreateNewGroup;
