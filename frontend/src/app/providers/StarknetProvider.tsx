"use client";

import { StarknetConfig, InjectedConnector } from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { jsonRpcProvider } from "@starknet-react/core";

const chains = [sepolia, mainnet];

const connectors = [
  new InjectedConnector({ options: { id: "braavos" } }),
  new InjectedConnector({ options: { id: "argentX" } }),
];

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      chains={chains}
      connectors={connectors}
      provider={jsonRpcProvider({
        rpc: (chain) => ({ nodeUrl: chain.rpcUrls.default.http[0] }),
      })}
    >
      {children}
    </StarknetConfig>
  );
}
