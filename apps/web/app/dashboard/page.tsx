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
import Nav from "../../components/Nav";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useEnsAvatar,
  useEnsName,
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
import Modal from "../../components/Modal";
import UpdateProfileModal from "./update-profile";
import TransactionsPage from "./transactions";
import InfoPage from "./info";
import Footer from "../../components/Footer";

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
  fullname: string;
  bio: string;
  avatarUrl: string;
  socials: string[];
  createAtBlock: bigint;
};

type ProfileStore = {
  profile: Profile | null;
  isLoading: boolean;
};

async function fetchUserProfile(
  address?: `0x${string}`
): Promise<Profile | null> {
  const [keyEncoded, profileEncoded, createAtBlock] =
    (await publicClient?.readContract({
      address: FUELME_ADDRESSES[CHAIN.id] as Address,
      abi: FUELME_ABI,
      functionName: "profilesOfAddress",
      args: [address],
    })) as [Hex, Hex, bigint];

  if (!keyEncoded || keyEncoded === "0x") return null;

  const profileDecoded = hexToString(profileEncoded);
  const profileArray = profileDecoded.split("|");

  return {
    fullname: profileArray[0] || "",
    avatarUrl: profileArray[1] || "",
    socials: profileArray[2] ? profileArray[2].split(",") : [],
    bio: profileArray[3] || "",
    createAtBlock,
  };
}

// Main Component
const DashboardPage = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const { data: ensData } = useEnsName();
  const initProfile = useUserStore((s) => s.initProfile);
  const user = useUserStore((s) => s.user);
  const isLoadingProfile = useUserStore((s) => s.loading);
  const [isShowCreateProfileModal, setIsShowCreateProfileModal] =
    useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileStore>({
    profile: null,
    isLoading: true,
  });

  console.log(user);

  const isAccountCreated = !!profile.profile;

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

    initUserProfileLocal();
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

  const updateProfile = async (
    fullname: string,
    avatarUrl: string,
    bio: string,
    socials: string[]
  ) => {
    let result: any;
    let txHash: Hex;
    if (!isAccountCreated) {
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
        [fullname, avatarUrl, bio, socials.join(",")].join("|")
      );

      txHash = await writeContractAsync({
        abi: FUELME_ABI,
        address: FUELME_ADDRESSES[CHAIN.id] as Address,
        functionName: "createProfile",
        args: [key, profileEncoded],
      });

      result = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      initProfile(
        stealthKey.viewingKey.privateKey,
        stealthKey.spendingKey.publicKey,
        result.blockNumber.toString()
      );
    } else {
      const profileEncoded = stringToHex(
        [fullname, avatarUrl, bio, socials.join(",")].join("|")
      );

      txHash = await writeContractAsync({
        abi: FUELME_ABI,
        address: FUELME_ADDRESSES[CHAIN.id] as Address,
        functionName: "updateProfile",
        args: [profileEncoded],
      });

      result = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
    }
    if (result.status === "success") {
      await loadProfile(address as Address);
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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-black text-white">
        <Nav>
          <ConnectButton />
        </Nav>
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <InfoPage
            profile={profile.profile}
            ensData={ensData}
            address={address as string}
            isAccountCreated={isAccountCreated}
            onCreateProfile={() => setIsShowCreateProfileModal(true)}
            onWithdraw={() => {}}
          />
          <TransactionsPage />
        </div>
        <Modal
          visible={isShowCreateProfileModal}
          onClose={() => setIsShowCreateProfileModal(false)}
        >
          <UpdateProfileModal
            profile={profile.profile || undefined}
            onClose={() => setIsShowCreateProfileModal(false)}
            isAccountCreated={isAccountCreated}
            updateProfile={updateProfile}
          />
        </Modal>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
