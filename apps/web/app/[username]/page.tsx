"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { CHAIN, publicClient } from "@fuelme/defination";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Hex, hexToString, stringToHex } from "viem";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, baseSepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import DonateForm, { Key } from "./form";

export type Profile = {
  username: string;
  fullname?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string[];
  key: Key;
};

const config = getDefaultConfig({
  appName: "Fuelme",
  projectId: "a785a0fcd3b62bf29680219fcd2409c4",
  chains: [baseSepolia, base],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const Icon = ({
  name,
  className = "w-6 h-6",
}: {
  name: string;
  className?: string;
}) => {
  switch (name) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M18.244 2H21l-6.53 7.46L22 22h-6.9l-4.51-5.82L4.5 22H2l7.02-8.02L2 2h6.9l4.1 5.29L18.244 2Zm-2.41 18h1.79L8.23 4h-1.8l9.404 16Z" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.32-1.75-1.32-1.75-1.08-.74.08-.73.08-.73 1.2.09 1.84 1.23 1.84 1.23 1.06 1.83 2.78 1.3 3.46.99.11-.77.41-1.3.74-1.6-2.67-.3-5.47-1.34-5.47-5.97 0-1.32.47-2.4 1.24-3.25-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.24a11.5 11.5 0 0 1 6 0c2.3-1.56 3.3-1.24 3.3-1.24.66 1.66.24 2.88.12 3.18.78.85 1.24 1.93 1.24 3.25 0 4.64-2.8 5.66-5.48 5.96.43.37.81 1.1.81 2.23v3.31c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z" />
        </svg>
      );
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M9.04 15.5 8.9 19a1 1 0 0 0 1.68.73l2.02-1.86 3.42 2.52c.63.46 1.54.12 1.73-.64l3.2-12.6c.2-.78-.52-1.48-1.28-1.21L2.67 11.3c-.93.33-.88 1.68.08 1.9l4.86 1.1 10.94-8.38-9.5 9.58c-.2.2-.33.46-.34.73Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M10.6 20.6 3.4 13.4a2 2 0 0 1 0-2.8l7.2-7.2a2 2 0 1 1 2.8 2.8L8.8 10H20a2 2 0 1 1 0 4H8.8l4.6 3.8a2 2 0 0 1-2.8 2.8Z" />
        </svg>
      );
  }
};

function getLinkType(url: string): "github" | "telegram" | "x" | "default" {
  try {
    const parsed = new URL(url.toLowerCase());

    if (parsed.hostname.includes("github.com")) {
      return "github";
    }
    if (
      parsed.hostname.includes("t.me") ||
      parsed.hostname.includes("telegram.me")
    ) {
      return "telegram";
    }
    if (
      parsed.hostname.includes("twitter.com") ||
      parsed.hostname.includes("x.com")
    ) {
      return "x";
    }

    return "default";
  } catch {
    // If it's not a valid URL, just return default
    return "default";
  }
}

const DonatePage: NextPage = () => {
  const params = useParams();
  const username = params.username as string;
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const profileEncoded = await publicClient.readContract({
        address: FUELME_ADDRESSES[CHAIN.id],
        abi: FUELME_ABI,
        functionName: "getProfile",
        args: [stringToHex(username)],
      });
      const profileData = profileEncoded
        ? ((profileEncoded as any)[1] as Hex)
        : null;
      const keyData = profileEncoded
        ? ((profileEncoded as any)[0] as Hex)
        : null;
      if (profileData == "0x" || keyData == "0x" || !profileData || !keyData) {
        setIsLoading(false);
        return;
      } else {
        const profileDecoded = hexToString(profileData);
        const profileArray = profileDecoded.split("|");

        const keyDecoded = hexToString(keyData);
        const keyArray = keyDecoded.split("|");

        setProfile({
          username,
          fullname: profileArray[0] || "",
          avatarUrl: profileArray[1] || "",
          socials: profileArray[2] ? profileArray[2].split(",") : [],
          bio: profileArray[3] || "",
          key: {
            spendingPublicKey: keyArray[0] as Hex,
            viewingPublicKey: keyArray[1] as Hex,
            encryptionPublicKey: keyArray[2] as String,
          },
        });
        setIsLoading(false);
      }
    };
    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-white/70">Loading profile...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-white/70">Profile not found.</div>
        <Link className="ml-2 text-white/70" href="/">
          Go back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg px-4 pt-10 pb-24">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-xl text-center w-full">
          <div className="flex flex-col items-center gap-5">
            <Image
              src={profile.avatarUrl || ""}
              alt={`${profile.fullname} avatar`}
              width={128}
              height={128}
              className="h-32 w-32 rounded-3xl object-cover ring-1 ring-white/20"
            />
            <div>
              <h1 className="text-2xl font-semibold">{profile.fullname}</h1>
              <p className="text-base text-white/70 mt-2">{profile.bio}</p>
            </div>
          </div>

          <div className="mt-5 flex justify-center flex-wrap gap-4">
            {profile.socials?.map((s, i) => (
              <a
                key={i}
                href={s}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <Icon name={getLinkType(s)} className="w-6 h-6" />
              </a>
            ))}
          </div>

          <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <WagmiProvider reconnectOnMount={false} config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>
                <DonateForm
                  username={profile.username}
                  fullname={profile.fullname || ""}
                  stealthKey={profile.key}
                />
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </section>
      </div>
    </main>
  );
};

export default DonatePage;
