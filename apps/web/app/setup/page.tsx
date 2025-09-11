/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";
import type { NextPage } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import BackgroundDecor from "../../components/BackgroundDecor";
import GlobalKeyframes from "../../components/GlobalKeyframes";
import Field from "../../components/Field";
import {
  useAccount,
  useClient,
  usePublicClient,
  useReadContract,
  useSignMessage,
} from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import {
  Address,
  createPublicClient,
  hashMessage,
  http,
  stringToHex,
} from "viem";
import {
  generateSpendingKeyFromSignature,
  getEncryptionPublicKey,
  STEALTH_SIGN_MESSAGE,
} from "@fuelme/stealth";
import { useStealthProfile } from "../../hooks/useStealthProfile";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { generateViewingKey } from "../../services/generateViewingKey";
import { uploadImage } from "../../services/uploadImage";
import { updateProfile } from "../../services/updateProfile";
import { useAuthorizedAccount } from "../../hooks/useAuthorizedAccount";
import { useRouter } from "next/navigation";

type UserDraft = {
  username: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
  socialLinks: string[];
};

const defaultUser: UserDraft = {
  username: "",
  fullName: "",
  avatarUrl:
    "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small_2x/default-avatar-icon-of-social-media-user-vector.jpg",
  bio: "",
  socialLinks: [],
};

const chain = baseSepolia;
const publicClient = createPublicClient({
  chain,
  transport: http(),
});

const SetupPage: NextPage = () => {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [user, setUser] = useState<UserDraft>(defaultUser);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const route = useRouter();

  const [usernameWarning, setUsernameWarning] = useState<string | null>(null);
  const [fullNameWarning, setFullNameWarning] = useState<string | null>(null);
  const [linkWarning, setLinkWarning] = useState<[number, string] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingAuthorizedAcccount = useAuthorizedAccount((s) => s.loading);
  const setAuthorizedAddress = useAuthorizedAccount((s) => s.onUpdateAddress);
  const authorizedAddress = useAuthorizedAccount((s) => s.authorizedAddress);
  const { isConnected, address } = useAccount();
  const { open, close } = useAppKit();
  const { signMessageAsync, isPending } = useSignMessage();

  const [confirmStepTitle, setConfirmStepTitle] = useState("Sign to confirm");

  useEffect(() => {
    if (!isLoadingAuthorizedAcccount && authorizedAddress) {
      route.push("/dashboard");
    }
  }, [isLoadingAuthorizedAcccount, authorizedAddress]);

  useEffect(() => setMounted(true), []);

  const toast = (msg: string) => {
    if (typeof window === "undefined") return;
    const el = document.createElement("div");
    el.textContent = msg;
    el.className =
      "fixed bottom-4 right-4 z-50 rounded-full bg-white text-black text-xs font-semibold px-3 py-1.5 shadow";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  };

  const handleUsernameSubmit = async () => {
    const profile = (await publicClient?.readContract({
      address: FUELME_ADDRESSES[chain.id] as Address,
      abi: FUELME_ABI,
      functionName: "getProfile",
      args: [hashMessage(user.username)],
    })) as any;

    if (profile[0] != "0x") {
      setUsernameWarning("Username is already taken");
      return;
    }
    setStep(2);
  };

  const handleBasicInfoSubmit = async () => {
    if (user.fullName.length == 0) {
      setFullNameWarning("Full name cannot be empty");
      return;
    }

    for (let i = 0; i < user.socialLinks.length; i++) {
      const link = user.socialLinks[i];
      if (link.trim().length == 0) {
        setLinkWarning([i, "Link cannot be empty"]);
        return;
      }
      try {
        new URL(link);
      } catch (e) {
        setLinkWarning([i, "Invalid URL"]);
        return;
      }
    }
    setStep(3);
  };

  const handleConfirmWithWallet = async () => {
    try {
      const signature = await signMessageAsync({
        message: STEALTH_SIGN_MESSAGE,
      });

      setConfirmStepTitle("Compute stealth keys...");
      const spendingKey = generateSpendingKeyFromSignature(signature);
      const authorizeAccount = privateKeyToAccount(spendingKey.privateKey);

      const authorizeSignature = await authorizeAccount.signMessage({
        message: "FuelMe Authorization",
      });

      const viewingKey = await generateViewingKey(
        authorizeAccount.address,
        authorizeSignature
      );

      let avatarUpload: string = user.avatarUrl;
      if (user.avatarUrl.startsWith("data:")) {
        setConfirmStepTitle("Uploading avatar...");
        avatarUpload = await uploadImage(user.avatarUrl, {
          kind: "avatar",
        });
      }

      setConfirmStepTitle("Submitting profile...");
      const profile = stringToHex(
        [
          user.fullName,
          avatarUpload,
          user.socialLinks.join(","),
          user.bio || "",
        ].join("|")
      );
      const encryptionPublicKey = getEncryptionPublicKey(
        spendingKey.privateKey.slice(2)
      );
      const key = stringToHex(
        [spendingKey.publicKey, viewingKey.publicKey, encryptionPublicKey].join(
          "|"
        )
      );

      const nonce = BigInt(new Date().valueOf());

      const createProfileSignature = await authorizeAccount.signTypedData({
        domain: {
          name: "FuelMe",
          version: "1",
          chainId: chain.id,
          verifyingContract: FUELME_ADDRESSES[chain.id] as Address,
        },
        types: {
          UpdateProfile: [
            { name: "key", type: "bytes" },
            { name: "profile", type: "bytes" },
            { name: "nonce", type: "uint256" },
          ],
        },
        primaryType: "UpdateProfile",
        message: {
          key: key,
          profile: profile,
          nonce: nonce,
        },
      });

      const txHash = await updateProfile(
        stringToHex(user.username),
        key,
        profile,
        nonce,
        createProfileSignature
      );
      setConfirmStepTitle("Profile created!");
      setAuthorizedAddress(authorizeAccount.address);
      route.push("/dashboard");
      toast("Profile created! Tx hash: " + txHash);
    } catch (e: any) {
      toast("Fail to create profile, please try again" + e.toString());
      setConfirmStepTitle("Sign to confirm");
      return;
    }
  };

  const canGoNextFrom1 = user.username.trim().length >= 3;
  const canGoNextFrom2 = user.fullName.trim().length >= 2;

  const progressPct = useMemo(
    () => (step === 1 ? 33 : step === 2 ? 66 : 100),
    [step]
  );

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-3 sm:px-4 lg:px-6">
        <BackgroundDecor />
        <GlobalKeyframes />

        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            Welcome to Fuelme
          </h1>
          <p className="mt-2 text-white/70 text-sm sm:text-base">
            Please connect your wallet to set up your profile
          </p>
        </div>
        <button
          className="rounded-full bg-white text-black px-6 py-3 text-sm font-semibold shadow hover:opacity-90"
          onClick={() => open()}
        >
          Connect Wallet
        </button>
      </main>
    );
  }

  if (isLoading || isLoadingAuthorizedAcccount) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-3 sm:px-4 lg:px-6">
        <BackgroundDecor />
        <GlobalKeyframes />

        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            Loading your profile...
          </h1>
          <p className="mt-2 text-white/70 text-sm sm:text-base">Please wait</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen bg-black text-white ${mounted ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
    >
      <BackgroundDecor />
      <GlobalKeyframes />

      <div className="text-center pt-10 px-3 sm:px-4 lg:px-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
          Welcome to Fuelme
        </h1>
        <p className="mt-2 text-white/70 text-sm sm:text-base">
          Create your profile in three simple steps
        </p>
        <p className="mt-2 justify-center text-white/70 text-sm sm:text-base flex items-center gap-2">
          <appkit-button />
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-6 grid gap-4 lg:grid-cols-3">
        <aside className="rounded-2xl bg-white/5 backdrop-blur p-6 lg:col-span-1">
          <h2 className="text-sm font-semibold mb-3 text-white/80">
            Profile Setup
          </h2>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <ol className="space-y-2 text-sm">
            <li
              className={`flex items-center gap-2 ${step >= 1 ? "text-white" : "text-white/50"}`}
            >
              <span
                className={`h-5 w-5 grid place-items-center rounded-full border ${step >= 1 ? "border-white bg-white text-black" : "border-white/30"}`}
              >
                1
              </span>
              Choose username
            </li>
            <li
              className={`flex items-center gap-2 ${step >= 2 ? "text-white" : "text-white/50"}`}
            >
              <span
                className={`h-5 w-5 grid place-items-center rounded-full border ${step >= 2 ? "border-white bg-white text-black" : "border-white/30"}`}
              >
                2
              </span>
              Basic information
            </li>
            <li
              className={`flex items-center gap-2 ${step >= 3 ? "text-white" : "text-white/50"}`}
            >
              <span
                className={`h-5 w-5 grid place-items-center rounded-full border ${step >= 3 ? "border-white bg-white text-black" : "border-white/30"}`}
              >
                3
              </span>
              Confirm
            </li>
          </ol>
        </aside>

        <section className="rounded-2xl bg-white/5 backdrop-blur p-6 lg:col-span-2">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white/90">
                Step 1 · Choose your username
              </h3>
              <Field label="Username">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">fuelme.fun/</span>
                  <input
                    className="field h-9 flex-1"
                    placeholder="yourname"
                    value={user.username}
                    onChange={(e) => {
                      setUsernameWarning(null);
                      setUser((u) => ({
                        ...u,
                        username: e.target.value
                          .toLowerCase()
                          .replace(/\s/g, ""),
                      }));
                    }}
                  />
                </div>
                {usernameWarning && (
                  <p className="text-xs text-amber-400">{usernameWarning}</p>
                )}
              </Field>
              <div className="flex justify-between">
                <div />
                <button
                  className={`rounded-full bg-white text-black px-4 py-2 text-sm font-semibold shadow hover:opacity-90 ${canGoNextFrom1 ? "" : "disabled:*opacity-50 cursor-not-allowed"}`}
                  disabled={!canGoNextFrom1}
                  onClick={handleUsernameSubmit}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white/90">
                Step 2 · Basic information
              </h3>
              <div className="grid gap-3">
                <span className="text-xs text-white/70">Avatar</span>
                <div
                  className="relative h-40 w-40 aspect-square rounded-xl overflow-hidden ring-2 ring-white/10 group cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Click to change avatar"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || user.username || "avatar"}
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
                      setUser((s) => ({ ...s, avatarUrl: dataUrl }));
                    }}
                  />
                </div>
              </div>
              <Field label="Full name">
                <input
                  className="field h-9"
                  placeholder="e.g. Satoshi Nakamoto"
                  value={user.fullName}
                  onChange={(e) =>
                    setUser((u) => ({ ...u, fullName: e.target.value }))
                  }
                />
                {fullNameWarning && (
                  <p className="text-xs text-amber-400">{fullNameWarning}</p>
                )}
              </Field>
              <Field label="Bio">
                <textarea
                  className="field min-h-[72px]"
                  placeholder="Short collector statement"
                  value={user.bio || ""}
                  onChange={(e) =>
                    setUser((u) => ({ ...u, bio: e.target.value }))
                  }
                />
              </Field>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-white/70">Social links</span>
                <button
                  className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10"
                  onClick={() => {
                    setUser((u) => {
                      return {
                        ...u,
                        socialLinks: [...u.socialLinks, ""],
                      };
                    });
                  }}
                >
                  + Add link
                </button>
              </div>
              {user.socialLinks.map((link, idx) => (
                <div
                  key={`-${idx}`}
                  className="grid grid-cols-[1fr_auto] gap-2 items-center"
                >
                  <input
                    className="field h-9"
                    placeholder="https://…"
                    value={link}
                    onChange={(e) => {
                      if (linkWarning?.[0] === idx) {
                        setLinkWarning(null);
                      }
                      setUser((u) => {
                        const newLinks = [...u.socialLinks];
                        newLinks[idx] = e.target.value;
                        return { ...u, socialLinks: newLinks };
                      });
                    }}
                  />
                  <button
                    className="icon-btn text-white/80 hover:text-white"
                    onClick={() => {
                      if (linkWarning?.[0] === idx) {
                        setLinkWarning(null);
                      }
                      setUser((u) => ({
                        ...u,
                        socialLinks: u.socialLinks.filter((_, i) => i !== idx),
                      }));
                    }}
                  >
                    ✕
                  </button>
                  {linkWarning?.[0] === idx && (
                    <p className="text-xs text-amber-400">{linkWarning[1]}</p>
                  )}
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <button
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    className={`rounded-full bg-white text-black px-4 py-2 text-sm font-semibold shadow hover:opacity-90 ${canGoNextFrom2 ? "" : "disabled:*opacity-50 cursor-not-allowed"}`}
                    disabled={!canGoNextFrom2}
                    onClick={handleBasicInfoSubmit}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white/90">
                Step 3 · Confirm
              </h3>
              <div className="rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 p-[2px] shadow-lg">
                <div className="rounded-2xl bg-black p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60">You're almost done</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      fuelme.fun/{user.username || "yourname"}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 backdrop-blur p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || user.username || "avatar"}
                    className="h-20 w-20 aspect-square object-cover rounded-xl ring-1 ring-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-semibold">
                        {user.fullName || "(No name)"}
                      </span>
                      <span className="text-xs text-white/60">
                        @{user.username || "yourname"}
                      </span>
                    </div>
                    {user.bio && (
                      <p className="mt-2 text-sm leading-relaxed text-white/80 whitespace-pre-wrap break-words">
                        {user.bio}
                      </p>
                    )}
                    {user.socialLinks?.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs text-white/60">Links</span>
                        <ul className="mt-1 grid gap-1">
                          {user.socialLinks.map((l, i) => (
                            <li key={`-${i}`} className="text-sm">
                              <a
                                className="underline decoration-dotted underline-offset-2 break-all text-white"
                                href={l}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {l}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/70">
                Connect your wallet and press Confirm to finalize your profile.
              </p>
              <div className="flex justify-between pt-2">
                <button
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  className={`rounded-full bg-white text-black px-4 py-2 text-sm font-semibold shadow hover:opacity-90 ${isConnected ? "" : "disabled:*opacity-50 cursor-not-allowed"}`}
                  disabled={
                    !isConnected || confirmStepTitle != "Sign to confirm"
                  }
                  onClick={handleConfirmWithWallet}
                >
                  {confirmStepTitle}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default SetupPage;
