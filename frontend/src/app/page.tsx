"use client";

import CreateGroupForm from "./components/CreateGroupForm";
import WalletConnect from "./components/WalletConnect";
import UserBalance from "./components/UserBalance";
import { useAccount, useNetwork } from "@starknet-react/core";
import { sepolia } from "@starknet-react/chains";

export default function Home() {
  async function Fetch() {
    const req = await fetch("http://0.0.0.0:8080/");
    console.log(req)
    const response = await req.json();
    console.log(response)
  }
  
  function post() {
    fetch("http://68.183.139.104:8080/pay_member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        "0x02ee4892cf574a6db0307d49b502db2882c288dc02a1166fdec2ba754a663592"
      ),
    })
      .then((success) => {
        console.log("Payment made to ", "address");
        console.log("success: ", success);
      })
      .catch((err) => {
        console.log("An error occured ", err);
      });
  }
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Wallet Connection */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SwiftSwap</h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserBalance />
              <WalletConnect />
            </div>
            <button onClick={post}  className="p-6 bg-gray-500 rounded-xl">test fetch</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConnectionGuard>
            <CreateGroupForm />
          </ConnectionGuard>
        </div>
      </main>
    </div>
  );
}

// Component to guard content based on wallet connection
function ConnectionGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Wallet Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your Starknet wallet to create and manage groups.
            </p>
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  if (chain?.id !== sepolia.id) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Wrong Network
            </h2>
            <p className="text-gray-600 mb-4">
              Please switch to Sepolia testnet to use this application.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                Current network:{" "}
                <span className="font-medium">{chain?.name || "Unknown"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
