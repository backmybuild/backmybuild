/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Address,
  createPublicClient,
  formatEther,
  hashMessage,
  Hex,
  hexToString,
  http,
  stringToHex,
} from "viem";
import Link from "next/link";
import Logo from "../../components/Logo";
import { baseSepolia } from "viem/chains";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { signOut, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { updateProfile, getSpendingAddress } from "./actions";
import { LogOut } from "lucide-react";
import { toast } from "react-toastify";

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
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  valueWei: bigint;
  timestamp: number; // seconds
};

export type Profile = {
  username: string;
  fullname?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string[];
};

type ProfileStore = {
  profile: Profile | null;
  isLoading: boolean;
};

async function fetchUserProfile(
  address?: `0x${string}`
): Promise<Profile | null> {
  const profileData = (await publicClient?.readContract({
    address: FUELME_ADDRESSES[chain.id] as Address,
    abi: FUELME_ABI,
    functionName: "getProfileByAddress",
    args: [address],
  })) as any;

  const usernameEncoded = profileData[0] as Hex;
  const profileEncoded = profileData[2] as Hex;

  const username = hexToString(usernameEncoded);
  const profileDecoded = hexToString(profileEncoded);
  const profileArray = profileDecoded.split("|");

  return {
    username,
    fullname: profileArray[0] || "",
    avatarUrl: profileArray[1] || "",
    socials: profileArray[2] ? profileArray[2].split(",") : [],
    bio: profileArray[3] || "",
  };
}

// Utilities
function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function trimHash(h: string, left = 6, right = 4) {
  if (h.length <= left + right) return h;
  return `${h.slice(0, left)}...${h.slice(-right)}`;
}

// Modal primitive
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-[#0b0b0b] border border-white/10 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">{title ?? "Modal"}</h3>
          <button
            className="rounded-full w-8 h-8 bg-white/5 hover:bg-white/10"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Inputs
function Field({
  label,
  ...props
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm text-white/70">{label}</div>}
      <input
        {...props}
        className={`w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-white/20 ${props.className ?? ""}`}
      />
    </label>
  );
}

function TextArea({
  label,
  ...props
}: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm text-white/70">{label}</div>}
      <textarea
        {...props}
        className={`w-full min-h-[92px] rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20 ${props.className ?? ""}`}
      />
    </label>
  );
}

function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-10 px-4 rounded-xl bg-white text-black font-medium hover:bg-white/90 active:scale-[.99] ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-10 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

const chain = baseSepolia;
const publicClient = createPublicClient({
  chain,
  transport: http(),
});

// Main Component
const FuelmeDashboardPage = () => {
  const { status, data } = useSession();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [txs, setTxs] = useState<TxItem[]>([]);
  const [profileStore, setProfileStore] = useState<ProfileStore>({
    isLoading: true,
    profile: {
      username: "",
      fullname: data?.user?.name || "",
      avatarUrl: data?.user?.image || "",
      bio: "",
      socials: [],
    },
  });
  const profile = profileStore.profile;
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [usernameWarning, setUsernamWarning] = useState<string | null>(null);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openSetupModal, setOpenSetupModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local editable state for profile modal
  const [form, setForm] = useState<Profile>({ username: "" });

  const loadProfile = async () => {
    const spendingAddress: Address = await getSpendingAddress();
    const profile = await fetchUserProfile(spendingAddress);
    if (!profile?.username) {
      setOpenSetupModal(true);
    } else {
      if (openSetupModal) setOpenSetupModal(false);
    }
    setProfileStore({ profile, isLoading: false });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadProfile();
    }
  }, [status]);

  const handleShare = async () => {
    // const url = `${window.location.origin}/@${profile?.username ?? address}`;
    // await navigator.clipboard.writeText(url); alert("Share link copied to clipboard!\n" + url);
  };

  const onOpenProfile = () => {
    if (profile) setForm(profile);
    setOpenProfileModal(true);
  };

  const onSaveProfile = async () => {
    setSaving(true);
    try {
      const txHash = await updateProfile(
        form.username,
        form.fullname || "",
        form.avatarUrl || "",
        form.bio || "",
        form.socials || []
      );
      if (txHash) toast.success("Profile updated successfully!");
      if (txHash) await loadProfile();
      setOpenProfileModal(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile.");
    }
    setSaving(false);
  };

  const onClaimUsername = async () => {
    if (!pendingUsername) return;
    if (!data?.user) return;
    const profile = (await publicClient?.readContract({
      address: FUELME_ADDRESSES[chain.id] as Address,
      abi: FUELME_ABI,
      functionName: "getProfile",
      args: [stringToHex(pendingUsername)],
    })) as any;

    if (profile[0] != "0x") {
      setUsernamWarning("Username is already taken");
      return;
    }

    const txHash = await updateProfile(
      pendingUsername,
      data?.user?.name || "",
      data?.user?.image || "",
      "",
      []
    );

    console.log(txHash);
    await loadProfile();
  };

  if (status === "loading" || profileStore.isLoading) {
    return (
      <main className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <nav className="sticky top-0 z-30 bg-black/50 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-wide">FuelMe</span>
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* HERO — Total Earned only */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/[.06] to-white/[.02] p-6 sm:p-8">
          {/* subtle grid */}
          <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_50%_0%,_rgba(255,255,255,.15),_rgba(0,0,0,0)_70%)]" />
          <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)]; [background-size:20px_20px] opacity-10" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative">
            <div className="flex items-center gap-4">
              <img
                src={profile?.avatarUrl || "/avatar.png"}
                alt="avatar"
                className="w-20 h-20 rounded-2xl object-cover border border-white/10"
              />
              <div>
                <div className="text-2xl font-bold">
                  {profile?.fullname || profile?.username}
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="p-1 ml-2 hover:cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
                  </button>
                </div>
                <div className="text-sm text-white/70">
                  <Link
                    href={`/${profile?.username || ""}`}
                    target="_blank"
                    className="underline decoration-dotted hover:opacity-80"
                  >
                    https://fuelme.fun/{profile?.username || "user"}
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GhostButton onClick={onOpenProfile}>Update profile</GhostButton>
              <PrimaryButton onClick={onOpenProfile}>Send USDC</PrimaryButton>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 max-w-lg">
            <h2 className="text-sm text-white/70">Total earned</h2>
            <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-[radial-gradient(100%_100%_at_0%_0%,_#fff,_#9be7ff_40%,_#7cfad2_70%,_#ffffff_100%)] drop-shadow-[0_0_25px_rgba(124,250,210,0.25)]">
              123.456 USDC
            </span>
            <div className="mt-2 text-sm text-white/70">
              Across{" "}
              <span className="font-semibold text-white">{txs.length}</span>{" "}
              tips — thank you! 💚
            </div>
          </div>
        </section>

        {/* Transactions */}
        <section className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold">Transaction history</h3>
            {loadingTxs && (
              <div className="text-xs text-white/60">Loading…</div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="text-left font-medium px-4 h-10">Time</th>
                  <th className="text-left font-medium px-4 h-10">From</th>
                  <th className="text-left font-medium px-4 h-10">Tx Hash</th>
                  <th className="text-right font-medium px-4 h-10">
                    Amount (ETH)
                  </th>
                </tr>
              </thead>
              <tbody>
                {txs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-white/60"
                    >
                      No transactions yet.
                    </td>
                  </tr>
                )}
                {txs.map((t) => (
                  <tr
                    key={t.hash}
                    className="border-t border-white/10 hover:bg-white/[.04]"
                  >
                    <td className="px-4 h-12 align-middle">
                      {formatTime(t.timestamp)}
                    </td>
                    <td className="px-4 h-12 align-middle">
                      {trimHash(t.from)}
                    </td>
                    <td className="px-4 h-12 align-middle">
                      <a
                        href={`https://basescan.org/tx/${t.hash}`}
                        target="_blank"
                        className="underline decoration-dotted hover:opacity-80"
                      >
                        {trimHash(t.hash)}
                      </a>
                    </td>
                    <td className="px-4 h-12 text-right align-middle font-medium">
                      {Number(formatEther(t.valueWei)).toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Modal
        open={openSetupModal}
        onClose={() => {}}
        title="Claim your username"
      >
        <div className="space-y-4">
          <Field
            label="Username"
            placeholder="Your username"
            value={pendingUsername ?? ""}
            onChange={(e) => {
              setUsernamWarning(null);
              setPendingUsername(e.target.value);
            }}
          />
          {usernameWarning && (
            <p className="text-xs text-amber-400">{usernameWarning}</p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <PrimaryButton
              onClick={onClaimUsername}
              disabled={
                pendingUsername === null || pendingUsername.trim() === ""
              }
            >
              Claim Your Username
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal
        open={openProfileModal}
        onClose={() => setOpenProfileModal(false)}
        title="Update your profile"
      >
        <div className="space-y-4">
          <div className="grid gap-3">
            <span className="text-xs text-white/70">Avatar</span>
            <div
              className="relative h-40 w-40 aspect-square rounded-xl overflow-hidden ring-2 ring-white/10 group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
              title="Click to change avatar"
            >
              <img
                src={form.avatarUrl || "/avatar.png"}
                alt={"avatar"}
                className="h-40 w-40 aspect-square object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/15 transition-colors" />
              <input
                ref={avatarInputRef}
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const dataUrl = await (
                    await import("../../services")
                  ).fileToDataUrl(f);
                  setForm((s) => ({ ...s, avatarUrl: dataUrl }));
                }}
              />
            </div>
          </div>
          <Field
            label="Display name"
            placeholder="John Doe"
            value={form.fullname ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullname: e.target.value }))
            }
          />
          <TextArea
            label="Bio"
            placeholder="Say something about you…"
            value={form.bio ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />

          {/* Social links editor */}
          <div className="space-y-2">
            <div className="text-sm text-white/70">Social links</div>
            {(form.socials ?? []).map((s, idx) => (
              <div key={idx} className="grid grid-cols-[5fr_1fr_auto] gap-2">
                <Field
                  placeholder="https://…"
                  value={s}
                  onChange={(e) => {
                    const arr = [...(form.socials ?? [])];
                    arr[idx] = e.target.value;
                    setForm((f) => ({ ...f, socials: arr }));
                  }}
                />
                <button
                  className="rounded-xl bg-white/5 border border-white/10 px-3 text-sm hover:bg-white/10"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      socials: (f.socials ?? []).filter((_, i) => i !== idx),
                    }))
                  }
                >
                  x
                </button>
              </div>
            ))}
            <button
              className="rounded-xl bg-white/5 border border-white/10 px-3 h-9 text-sm hover:bg-white/10"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  socials: [...(f.socials ?? []), ""],
                }))
              }
            >
              + Add social link
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <GhostButton onClick={() => setOpenProfileModal(false)}>
              Cancel
            </GhostButton>
            <PrimaryButton onClick={onSaveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default FuelmeDashboardPage;
