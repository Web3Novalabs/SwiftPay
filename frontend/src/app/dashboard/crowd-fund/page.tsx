"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import group1icon from "../../../../public/PlusCircle.svg";
import Image from "next/image";

const CrowdFundPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    tokenType: "",
    targetAmount: "",
    walletAddress: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission logic here
  };

  return (
    <div className="min-h-screen">
      <div className="">
        {/* Header Section */}
        <div className="mb-8 border-b border-[#FFFFFF0D] pb-8">
          <h1 className="text-xl font-bold text-[#DFDFE0] mb-2">
            Crowd Funding
          </h1>
          <p className="text-[#8398AD] text-base">
            Create new funding or view all fundings
          </p>
        </div>

        {/* Crowd Funding Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Crowd Funding Details Section */}
          <div className="space-y-4 border-b border-[#FFFFFF0D] pb-10">
            <h2 className="text-lg font-semibold text-[#E2E2E2]">
              Crowd Funding Details
            </h2>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#E2E2E2]">
                Name
              </label>
              <Input
                type="text"
                placeholder="Enter name for your crowd funding"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full bg-transparent py-4 sm:py-6 px-3 sm:px-4 bg-[#FFFFFF0D] rounded-sm text-[#8398AD] border border-[#FFFFFF0D] placeholder:text-[#8398AD] focus:outline-none focus:ring-0 focus:border-[#FFFFFF0D]"
              />
            </div>
          </div>

          {/* Set Amount Target/Threshold Section */}
          <div className="space-y-4 border-b border-[#FFFFFF0D] pb-10">
            <h2 className="text-lg font-semibold text-[#E2E2E2]">
              Set Amount Target/Threshold
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Token Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#E2E2E2]">
                  Token Type
                </label>
                <Select
                  value={formData.tokenType}
                  onValueChange={(value) =>
                    handleInputChange("tokenType", value)
                  }
                >
                  <SelectTrigger className="w-full py-4 sm:py-6 px-3 sm:px-4 bg-[#FFFFFF0D] rounded-sm text-[#8398AD] border border-[#FFFFFF0D]">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1F2937] border border-[#FFFFFF0D] text-[#8398AD]">
                    <SelectItem value="strk">STRK</SelectItem>
                    <SelectItem value="eth">ETH</SelectItem>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="btc">BTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#E2E2E2]">
                  Target in Amount
                </label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    handleInputChange("targetAmount", e.target.value)
                  }
                  className="w-full py-4 sm:py-6 px-3 sm:px-4 bg-[#FFFFFF0D] rounded-sm text-[#8398AD] border border-[#FFFFFF0D] placeholder:text-[#8398AD] focus:outline-none focus:ring-0 focus:border-[#FFFFFF0D]"
                />
              </div>
            </div>
          </div>

          {/* Receiver Address Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#E2E2E2]">
              Receiver Address When Target is Met
            </h2>

            <div className="space-y-2 mt-2">
              <label className="block text-sm font-medium text-[#E2E2E2]">
                Wallet address
              </label>
              <Input
                type="text"
                placeholder="enter wallet address"
                value={formData.walletAddress}
                onChange={(e) =>
                  handleInputChange("walletAddress", e.target.value)
                }
                className="w-full py-4 sm:py-6 px-3 sm:px-4 bg-[#FFFFFF0D] rounded-sm text-[#8398AD] border border-[#FFFFFF0D] placeholder:text-[#8398AD] focus:outline-none focus:ring-0 focus:border-[#FFFFFF0D] font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-4 bg-gradient-to-r from-[#434672] to-[#755a5a] text-white font-semibold rounded-sm hover:opacity-90 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Image
                src={group1icon}
                alt="group1icon"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              Create Crowd Funding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrowdFundPage;
