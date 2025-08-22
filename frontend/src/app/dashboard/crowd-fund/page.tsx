"use client";

import React, { useState } from "react";
import CrowdFundDashboard from "./components/CrowdFundDashboard";
import CreateCrowdFundForm from "./components/CreateCrowdFundForm";
import FundingDetailsModal from "./components/FundingDetailsModal";

// Type definitions
interface FundingData {
  id: number;
  title: string;
  progress: number;
  donors: number;
  dateCreated: string;
  targetAmount: string;
  currentAmount: string;
  description?: string;
}

interface FormData {
  name: string;
  tokenType: string;
  targetAmount: string;
  walletAddress: string;
}

const fundingData: FundingData[] = [
  {
    id: 1,
    title: "Visa Application",
    progress: 79,
    donors: 12,
    dateCreated: "20th - 08 - 2025",
    targetAmount: "$5,000",
    currentAmount: "$3,950",
  },
  {
    id: 2,
    title: "School Fees",
    progress: 55,
    donors: 5,
    dateCreated: "29th - 08 - 2025",
    targetAmount: "$3,000",
    currentAmount: "$1,650",
  },
];

type currentView = "dashboard" | "create";

const CrowdFundPage = () => {
  const [currentView, setCurrentView] = useState<currentView>("dashboard");
  const [selectedFunding, setSelectedFunding] = useState<FundingData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateNew = () => {
    setCurrentView("create");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  const handleViewDetails = (id: number) => {
    const funding = fundingData.find((f) => f.id === id);
    setSelectedFunding(funding || null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (formData: FormData) => {
    console.log("Form submitted:", formData);
    // Handle form submission logic here
    // After successful submission, you might want to:
    // 1. Add the new funding to the list
    // 2. Show a success message
    // 3. Return to dashboard
    setCurrentView("dashboard");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFunding(null);
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

        {/* Dynamic Content */}
        {currentView === "dashboard" ? (
          <CrowdFundDashboard
            onCreateNew={handleCreateNew}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <CreateCrowdFundForm
            onBack={handleBackToDashboard}
            onSubmit={handleFormSubmit}
          />
        )}

        {/* Funding Details Modal */}
        <FundingDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          funding={selectedFunding}
        />
      </div>
    </div>
  );
};

export default CrowdFundPage;
