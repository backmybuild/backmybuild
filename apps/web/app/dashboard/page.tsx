/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  Address,
  formatUnits,
  getAddress,
  Hex,
  hexToString,
  parseUnits,
  stringToHex,
} from "viem";
import Link from "next/link";
import Image from "next/image";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { useRouter } from "next/navigation";
import {
  updateProfile,
  getSpendingAddress,
  getUserBalanceAndTransaction,
  requestTransferOTP,
  handleSendUSDC,
  getViewingKey,
} from "./actions";
import { toast } from "react-toastify";
import {
  CHAIN,
  REQUEST_VIEWING_KEY_MESSAGE,
  TRANSFER_FEE,
  publicClient,
  STEALTH_SIGN_MESSAGE,
} from "@fuelme/defination";
import { OtpInput } from "./opt-input";
import Nav from "../../components/Nav";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useEnsAvatar,
  useSignMessage,
  useWriteContract,
} from "wagmi";
import {
  generateSpendingKeyFromSignature,
  generateStealthKeyFromSignature,
  getEncryptionPublicKey,
  StealthKey,
} from "@fuelme/stealth";
import { privateKeyToAccount } from "viem/accounts";
import { useUserStore } from "../../stores/useUserStore";
import CreateProfilePage from "./createProfilePage";

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
};

// ------------------------------------------------------------
// Fuelme — Dashboard Page (rev)
// - Big, beautiful Total Earned hero (ETH)
// - Removed balance + last tip cards
// - Friendlier, KOL/crypto‑oriented microcopy & styling
// - Modal to update profile + Share link
// - Pure TailwindCSS
// ------------------------------------------------------------

// Types
export type TxItem = {
  type: string;
  txHash: string;
  valueWei: bigint;
  timestamp: Date;
  message: string | null;
};

export type Profile = {
  username: string;
  fullname?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string[];
  createAtBlock: bigint;
};

type ProfileStore = {
  profile: Profile | null;
  isLoading: boolean;
};

async function fetchUserProfile(
  address?: `0x${string}`
): Promise<Profile | null> {
  const [usernameEncoded, keyEncoded, profileEncoded, createAtBlock] =
    (await publicClient?.readContract({
      address: FUELME_ADDRESSES[CHAIN.id] as Address,
      abi: FUELME_ABI,
      functionName: "profilesOfAddress",
      args: [address],
    })) as [Hex, Hex, Hex, bigint];

  if (!usernameEncoded || usernameEncoded === "0x") return null;

  const username = hexToString(usernameEncoded);
  const profileDecoded = hexToString(profileEncoded);
  const profileArray = profileDecoded.split("|");

  return {
    username,
    fullname: profileArray[0] || "",
    avatarUrl: profileArray[1] || "",
    socials: profileArray[2] ? profileArray[2].split(",") : [],
    bio: profileArray[3] || "",
    createAtBlock,
  };
}

// Main Component
const FuelmeDashboardPage = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const initProfile = useUserStore((s) => s.initProfile);
  const user = useUserStore((s) => s.user);
  const isLoadingProfile = useUserStore((s) => s.loading);
  const [profile, setProfile] = useState<ProfileStore>({
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    if (isConnected && address) {
      loadProfile(address);
    }
  }, [isConnected, address]);

  useEffect(() => {
    // have onchain profile but no local user, init local user
    const initUserProfileLocal = async () => {
      if (
        !profile.isLoading &&
        profile.profile &&
        !isLoadingProfile &&
        !user &&
        address
      ) {
        const stealthKey = await requestStealthKey();
        initProfile(
          stealthKey.viewingKey.privateKey,
          stealthKey.spendingKey.publicKey,
          profile.profile.createAtBlock.toString()
        );
      }
    };

    initUserProfileLocal()
  }, [profile, user, isLoadingProfile, address]);

  const requestStealthKey = async (): Promise<StealthKey> => {
    const authorizedSignature = await signMessageAsync({
      message: STEALTH_SIGN_MESSAGE,
    });

    const stealthKey = generateStealthKeyFromSignature(authorizedSignature);
    return stealthKey;
  };


  const loadProfile = async (address: Address) => {
    if (!address) return;
    const profile = await fetchUserProfile(address);
    if (!profile) {
      setProfile({ profile: null, isLoading: false });
    } else {
      setProfile({ profile, isLoading: false });
    }
  };
  const createProfile = async (username: string) => {
    const stealthKey = await requestStealthKey();

    const encryptionPublicKey = getEncryptionPublicKey(
      stealthKey.spendingKey.privateKey.slice(2)
    );

    const key = stringToHex(
      [
        stealthKey.spendingKey.publicKey,
        stealthKey.viewingKey.publicKey,
        encryptionPublicKey,
      ].join("|")
    );
    const profileEncoded = stringToHex(
      ["", "https://www.gravatar.com/avatar/?d=identicon", "", ""].join("|")
    );

    const txHash = await writeContractAsync({
      abi: FUELME_ABI,
      address: FUELME_ADDRESSES[CHAIN.id] as Address,
      functionName: "createProfile",
      args: [stringToHex(username), key, profileEncoded],
      gas: 1_000_000n,
    });

    const result = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    if (result.status === "success") {
      toast.success(
        <div>
          Profile updated
          <a
            href={CHAIN.blockExplorers.default.url + `/tx/${txHash}`}
            target="_blank"
            className="underline decoration-dotted hover:opacity-80 ml-2"
          >
            View on Explorer
          </a>
        </div>
      );
      loadProfile(address as Address);
      initProfile(
        stealthKey.viewingKey.privateKey,
        stealthKey.spendingKey.publicKey,
        result.blockNumber.toString()
      );
    } else {
      toast.error("Transaction failed");
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-[100dvh] bg-black text-white">
        <Nav>
          <ConnectButton />
        </Nav>
        <div className="flex flex-col items-center justify-center mt-20 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="mb-6 text-white/70">
            Please connect your Ethereum wallet to access the dashboard.
          </p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  if (profile.isLoading || isLoadingProfile) {
    return (
      <main className="min-h-[100dvh] bg-black text-white">
        <Nav>
          <ConnectButton />
        </Nav>
        <div className="flex flex-col items-center justify-center mt-20 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        </div>
      </main>
    );
  }

  if (!profile.isLoading && !profile.profile) {
    return (
      <main className="min-h-[100dvh] bg-black text-white">
        <Nav>
          <ConnectButton />
        </Nav>
        <div className="flex flex-col items-center justify-center mt-20 px-4 text-center">
          <CreateProfilePage onProfileCreated={createProfile} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <Nav>
        <ConnectButton />
      </Nav>
    </main>
  );
};

export default FuelmeDashboardPage;
