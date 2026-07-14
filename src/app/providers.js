'use client';

import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { GameProvider } from '../state/GameContext';

// The game lives on Base ($MRT token + MonacoEstate contracts).
const config = getDefaultConfig({
  appName: 'Mortgage Monaco',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '942be6e52002f232490df2cd9e69315d',
  chains: [base, mainnet],
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#ffffff',
          accentColorForeground: '#000000',
          borderRadius: 'medium',
        })}>
          <GameProvider>
            {children}
          </GameProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
