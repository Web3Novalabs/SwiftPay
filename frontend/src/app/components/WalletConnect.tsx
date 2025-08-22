"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
} from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { useState } from "react";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const [showConnectors, setShowConnectors] = useState(false);

  const getNetworkColor = (chainId?: string) => {
    if (!chainId) return "text-gray-500";
    if (chainId === sepolia.id) return "text-orange-600";
    if (chainId === mainnet.id) return "text-green-600";
    return "text-gray-500";
  };

  const getNetworkName = (chainId?: string) => {
    if (!chainId) return "Not Connected";
    if (chainId === sepolia.id) return "Sepolia Testnet";
    if (chainId === mainnet.id) return "Mainnet";
    return "Unknown Network";
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        {/* Network Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              chain?.id === sepolia.id
                ? "bg-orange-500"
                : chain?.id === mainnet.id
                ? "bg-green-500"
                : "bg-gray-400"
            }`}
          ></div>
          <span className={`text-sm font-medium ${getNetworkColor(chain?.id)}`}>
            {getNetworkName(chain?.id)}
          </span>
        </div>

        {/* Address Display */}
        <div className=" bg-gradient-to-r from-[#434672] to-[#755A5A] px-3 py-2 rounded-lg">
          <span className="text-sm font-mono text-white">
            {formatAddress(address || "")}
          </span>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-white border-gradient cursor-pointer transition-colors text-sm font-medium"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        className="md:px-4 md:py-2 px-2 py-1.5 text-white border-gradient cursor-pointer transition-colors text-xs md:text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>

      {showConnectors && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => {
                  connect({ connector });
                  setShowConnectors(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                {connector.id === "braavos"
                  ? "Braavos"
                  : connector.id === "argentX"
                  ? "Argent X"
                  : connector.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
