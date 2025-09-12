/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Address,
  createPublicClient,
  formatEther,
  formatUnits,
  hashMessage,
  Hex,
  hexToString,
  http,
  stringToHex,
} from "viem";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../components/Logo";
import { baseSepolia } from "viem/chains";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { signOut, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  updateProfile,
  getSpendingAddress,
  getUserBalanceAndTransaction,
  requestTransferOTP,
} from "./actions";
import { LogOut } from "lucide-react";
import { toast } from "react-toastify";
import { CHAIN } from "@fuelme/defination";

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

type OnchainInformation = {
  balance: bigint;
  txs: {
    type: string;
    txHash: string;
    address: string;
    ephemeralPublicKey: string | null;
    amountWei: bigint;
    createdAt: Date;
    message: string | null;
  }[];
  totalTxs: number;
};

// Main Component
const FuelmeDashboardPage = () => {
  const { status, data } = useSession();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [onchainInformation, setOnchainInformation] =
    useState<OnchainInformation | null>(null);
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
  const [openSendModal, setOpenSendModal] = useState(false);
  const [sendForm, setSendForm] = useState<{ to: string; amount: string }>({
    to: "",
    amount: "",
  });
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  // --- OTP states ---
  const [openOtpModal, setOpenOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const sendSummary = useMemo(() => {
    const amt = sendForm.amount?.trim() || "0";
    const amtDisplay = amt === "" ? "0" : amt;
    const toShort = sendForm.to ? trimHash(sendForm.to, 6, 6) : "";
    return { amtDisplay, toShort };
  }, [sendForm]);

  const sendErrors = useMemo(() => {
    const errs: string[] = [];
    if (!sendForm.to || !/^0x[a-fA-F0-9]{40}$/.test(sendForm.to)) {
      errs.push("Enter a valid EVM address (0x…).");
    }
    if (!sendForm.amount || Number(sendForm.amount) <= 0) {
      errs.push("Amount must be greater than 0.");
    }
    if (sendForm.amount && Number.isNaN(Number(sendForm.amount))) {
      errs.push("Amount must be a number.");
    }
    return errs;
  }, [sendForm]);

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

  const loadTxs = async () => {
    setLoadingTxs(true);
    const { balance, txs, totalTxs } = await getUserBalanceAndTransaction();
    setOnchainInformation({ balance, txs, totalTxs });
    setLoadingTxs(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadProfile();
      loadTxs();
    }
  }, [status]);

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
      if (txHash) {
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
        await loadProfile();
      }
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
    setSaving(true);
    try {
      const profile = (await publicClient?.readContract({
        address: FUELME_ADDRESSES[chain.id] as Address,
        abi: FUELME_ABI,
        functionName: "getProfile",
        args: [stringToHex(pendingUsername)],
      })) as any;

      if (profile[0] != "0x") {
        setUsernamWarning("Username is already taken");
      } else {
        const txHash = await updateProfile(
          pendingUsername,
          data?.user?.name || "",
          data?.user?.image || "",
          "",
          ["https://fuelme.fun/" + pendingUsername]
        );
        if (txHash) {
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
          await loadProfile();
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to claim username.");
    }
    setSaving(false);
  };

  const handleSendUsdc = async () => {
    // TODO: wire up contract call / wallet flow
    // You can access: sendForm.to, sendForm.amount (USDC, 6 decimals)
  };

  const handleOpenConfirm = () => {
    if (sendErrors.length === 0) setOpenConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    // close the review modal and request an OTP
    setOpenConfirmModal(false);
    setOtpError(null);
    setOtpCode("");
    setIsRequestingOtp(true);
    try {
      // include whatever your server needs to bind this OTP to the transfer intent
      const payload = {
        to: sendForm.to,
        amount: sendForm.amount,
        chainId: CHAIN?.id,
      };
      // const { challengeId } = await requestTransferOTP(payload);
      // setOtpChallengeId(challengeId);
      setOpenOtpModal(true);
      setResendCooldown(30); // 30s cooldown before re-send
      toast.info("OTP sent. Please check your email/app.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to request OTP. Please try again.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpChallengeId) return;
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError("Enter your OTP code.");
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      // const ok = await verifyTransferOtp(otpChallengeId, otpCode.trim());
      // if (!ok) {
      //   setOtpError("Invalid or expired OTP. Please try again.");
      //   return;
      // }
      // OTP OK — perform the real token send here
      await handleSendUsdc(); // your existing TODO implementation
      setOpenOtpModal(false);
      toast.success("Transfer sent ✅");
    } catch (e) {
      console.error(e);
      setOtpError("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    if (!sendForm.to || !sendForm.amount) return;

    setIsRequestingOtp(true);
    setOtpError(null);
    try {
      const payload = {
        to: sendForm.to,
        amount: sendForm.amount,
        chainId: CHAIN?.id,
      };
      // const { challengeId } = await requestTransferOTP(payload);
      // setOtpChallengeId(challengeId);
      setOtpCode("");
      setResendCooldown(30);
      toast.info("OTP re-sent.");
    } catch (e) {
      console.error(e);
      setOtpError("Could not resend OTP. Please try later.");
    } finally {
      setIsRequestingOtp(false);
    }
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
              <Image
                width={20}
                height={20}
                quality={100}
                src={profile?.avatarUrl || "/avatar.png"}
                alt="avatar"
                priority
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
              <PrimaryButton onClick={() => setOpenSendModal(true)}>
                Send USDC
              </PrimaryButton>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 max-w-lg">
            <h2 className="text-sm text-white/70">Total earned</h2>
            <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-[radial-gradient(100%_100%_at_0%_0%,_#fff,_#9be7ff_40%,_#7cfad2_70%,_#ffffff_100%)] drop-shadow-[0_0_25px_rgba(124,250,210,0.25)]">
              {formatUnits(onchainInformation?.balance || 0n, 6)} USDC
            </span>
            <div className="mt-2 text-sm text-white/70">
              Across{" "}
              <span className="font-semibold text-white">
                {onchainInformation?.totalTxs || 0}
              </span>{" "}
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
                  <th className="text-left font-medium px-4 h-10">Type</th>
                  <th className="text-left font-medium px-4 h-10">Tx Hash</th>
                  <th className="text-right font-medium px-4 h-10">Amount</th>
                  <th className="text-right font-medium px-4 h-10">Time</th>
                </tr>
              </thead>
              <tbody>
                {onchainInformation?.txs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-white/60"
                    >
                      No transactions yet.
                    </td>
                  </tr>
                )}
                {onchainInformation?.txs.map((t) => (
                  <tr
                    key={t.txHash}
                    className="border-t border-white/10 hover:bg-white/[.04]"
                  >
                    <td className="px-4 h-12 text-left align-middle font-medium">
                      {t.type}
                    </td>
                    <td className="px-4 h-12 align-middle">
                      <a
                        href={`${CHAIN.blockExplorers.default.url}/tx/${t.txHash}`}
                        target="_blank"
                        className="underline decoration-dotted hover:opacity-80"
                      >
                        {trimHash(t.txHash)}
                      </a>
                    </td>
                    <td className="px-4 h-12 text-right align-middle font-medium">
                      {Number(formatUnits(t.amountWei, 6)).toFixed(3)} USDC
                    </td>
                    <td className="h-12 px-4 text-right">
                      {t.createdAt.toLocaleString()}
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
            <PrimaryButton onClick={onSaveProfile} disabled={saving} className="disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
      <Modal
        open={openSendModal}
        onClose={() => {
          setSendForm({ to: "", amount: "" });
          setOpenSendModal(false)
        }}
        title="Send USDC"
      >
        <div className="space-y-4">
          <Field
            label="Receive address"
            placeholder="0x…"
            value={sendForm.to}
            onChange={(e) =>
              setSendForm((s) => ({ ...s, to: e.target.value.trim() }))
            }
          />

          <div className="space-y-2">
            <Field
              label="Amount (USDC)"
              placeholder="0.00"
              inputMode="decimal"
              value={sendForm.amount}
              onChange={(e) =>
                setSendForm((s) => ({ ...s, amount: e.target.value }))
              }
            />
          </div>

          {sendErrors.length > 0 && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-amber-200 text-sm">
              {sendErrors.map((e, i) => (
                <div key={i}>• {e}</div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <GhostButton onClick={() => setOpenSendModal(false)}>
              Cancel
            </GhostButton>
            <PrimaryButton
              onClick={handleOpenConfirm}
              disabled={sendErrors.length > 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                sendErrors.length > 0
                  ? "Fix the errors above to continue"
                  : undefined
              }
            >
              Review & Send
            </PrimaryButton>
          </div>
        </div>
      </Modal>
      <Modal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="Confirm transfer"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/70 mb-2">
              You’re about to send
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {sendSummary.amtDisplay}{" "}
              <span className="text-white/70 text-xl">USDC</span>
            </div>
            <div className="mt-3 text-sm">
              <div className="text-white/70">To</div>
              <div className="font-mono break-all">{sendForm.to}</div>
            </div>
            <div className="mt-3 text-sm text-white/60">
              Network:{" "}
              <span className="text-white">{CHAIN?.name ?? "Base"}</span>
            </div>
          </div>

          {/* Optional: small disclaimer */}
          <p className="text-xs text-white/60">
            Please double-check the address and amount. Crypto transfers are
            irreversible.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <GhostButton onClick={() => setOpenConfirmModal(false)}>
              Back
            </GhostButton>
            <PrimaryButton onClick={handleConfirmSend}>
              Confirm & Send
            </PrimaryButton>
          </div>
        </div>
      </Modal>
      <Modal
        open={openOtpModal}
        onClose={() => {
          setOtpCode("")
          setOpenOtpModal(false)
        }}
        title="Enter OTP to confirm"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            We’ve sent a one-time code to your registered destination. Enter it
            below to finalize the transfer.
          </p>

          <Field
            label="OTP Code"
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={8}
            value={otpCode}
            onChange={(e) => {
              setOtpError(null);
              setOtpCode(e.target.value.replace(/\s+/g, ""));
            }}
          />

          {otpError && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-amber-200 text-sm">
              {otpError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              className="h-10 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 disabled:opacity-50"
              onClick={handleResendOtp}
              disabled={isRequestingOtp || resendCooldown > 0}
              title={
                resendCooldown > 0
                  ? `Wait ${resendCooldown}s to resend`
                  : undefined
              }
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend OTP"}
            </button>

            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setOpenOtpModal(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingOtp ? "Verifying…" : "Verify & Send"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default FuelmeDashboardPage;
