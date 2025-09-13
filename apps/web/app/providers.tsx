"use client";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import { darkTheme, getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CHAIN } from "@fuelme/defination";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "Stealth.Giving",
  projectId: "a785a0fcd3b62bf29680219fcd2409c4",
  chains: [CHAIN],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColorForeground: "white",
            overlayBlur: "large",
          })}
        >
          <SessionProvider>
            {children}
            <ProgressBar
              color="#ffffff"
              height="4px"
              options={{
                showSpinner: false,
              }}
              shallowRouting
            />
            <ToastContainer theme="dark" />
          </SessionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Providers;
