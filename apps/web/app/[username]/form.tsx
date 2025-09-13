"use client";
import { useEffect, useMemo, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";
import { CHAIN, publicClient, USDC_ADDRESS } from "@fuelme/defination";
import {
  encodeAbiParameters,
  erc20Abi,
  Hex,
  hexToBytes,
  keccak256,
  parseAbiParameters,
  parseUnits,
  stringToHex,
} from "viem";
import { encryptSymmetric, generateStealthAddress } from "@fuelme/stealth";
import { FUELME_ADDRESSES } from "@fuelme/contracts";
import { toast } from "react-toastify";
import { donate } from "./action";

const formatEth = (v: string) => {
  if (!v) return "";
  const cleaned = v.replace(/[^0-9.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  const dec = rest.join("");
  return dec ? `${head}.${dec.slice(0, 6)}` : head;
};

const presets = ["0.5", "1", "5", "10"];

export type Key = {
  spendingPublicKey: Hex;
  viewingPublicKey: Hex;
  encryptionPublicKey: String;
};

type DonateProps = {
  username: string;
  fullname: string;
  stealthKey: Key;
};

const DonateForm: React.FC<DonateProps> = ({
  username,
  fullname,
  stealthKey,
}) => {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const currentChainId = useChainId();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [amount, setAmount] = useState("5");
  const [isSending, setIsSending] = useState(false);
  const { signTypedDataAsync } = useSignTypedData();
  const amt = useMemo(() => (amount ? Number(amount) : NaN), [amount]);
  const [isCustom, setIsCustom] = useState(false);
  const isValid = !Number.isNaN(amt) && amt > 0;

  const [message, setMessage] = useState(""); // added

  useEffect(() => {
    if (isConnected && address) {
      const fetchBalance = async () => {
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });

        setBalance(balance);
      };
      fetchBalance();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isCustom) setAmount("");
  }, [isCustom]);

  const onDonate = async () => {
    if (parseUnits(amount || "0", 6) > balance!) {
      toast.warning("Insufficient balance.");
      return;
    }
    setIsSending(true);
    try {
      if (!isValid) {
        toast.warn("Please enter a valid amount.");
        setIsSending(false);
        return;
      }
      if (!isConnected || !address || !stealthKey || !currentChainId) return;
      if (currentChainId !== CHAIN.id) {
        await switchChainAsync({
          chainId: CHAIN.id,
        });
      }
      const newStealthAddress = generateStealthAddress(
        stealthKey.spendingPublicKey,
        stealthKey.viewingPublicKey
      );

      const now = BigInt(Math.floor(Date.now() / 1000));

      const donationInfor = {
        to: newStealthAddress.address,
        viewTag: newStealthAddress.viewTag,
        ephemeralPublicKey: newStealthAddress.ephemeralPublicKey,
        message: stringToHex(message),
      };

      const donateHash = keccak256(
        encodeAbiParameters(
          parseAbiParameters(
            "address to, uint16 viewTag, bytes ephemeralPublicKey, bytes message"
          ),
          [
            donationInfor.to,
            donationInfor.viewTag,
            donationInfor.ephemeralPublicKey,
            donationInfor.message,
          ] as any
        )
      );

      const donateSignature = await signTypedDataAsync({
        types: {
          ReceiveWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
          ],
        },
        primaryType: "ReceiveWithAuthorization",
        domain: {
          name: "USDC",
          version: "2",
          chainId: CHAIN.id,
          verifyingContract: USDC_ADDRESS,
        },
        message: {
          from: address,
          to: FUELME_ADDRESSES[CHAIN.id],
          value: parseUnits(amount || "0", 6),
          validAfter: now,
          validBefore: now + BigInt(3600), // 1 hour
          nonce: donateHash,
        },
      });

      const txHash = await donate(username, donationInfor, {
        from: address,
        value: parseUnits(amount || "0", 6),
        validAfter: now,
        validBefore: now + BigInt(3600),
        signature: donateSignature,
      });

      toast.success(
        <div>
          Thank you for supporting{" "}
          <a
            href={CHAIN.blockExplorers.default.url + `/tx/${txHash}`}
            target="_blank"
            className="underline decoration-dotted hover:opacity-80 ml-2"
          >
            View on scan
          </a>
        </div>
      );
    } catch (error) {
      console.error("Donation error:", error);
      toast.error("Error processing donation. Please try again.");
    }
    setIsSending(false);
  };

  return (
    <div>
      <label htmlFor="amount" className="mb-2 block text-sm text-white/80">
        Support {fullname}
      </label>

      {/* Quick select buttons */}
      <div className="flex gap-2 mb-4">
        {[1, 5, 10].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setAmount(val.toString())}
            className={`flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition
          ${
            amount === val.toString()
              ? "bg-white text-black"
              : "bg-black/40 text-white/80 hover:bg-white/10"
          }`}
          >
            ${val}
          </button>
        ))}
        {isCustom ? (
          <div className="w-[120px] relative">
            <input
              type="number"
              autoFocus
              placeholder="Custom"
              value={amount}
              onChange={(e) => setAmount(formatEth(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none text-center"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className="w-[120px] rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition
      bg-black/40 text-white/80 hover:bg-white/10"
          >
            Custom
          </button>
        )}
      </div>

      {/* Balance */}
      <div className="mt-2 text-right text-xs text-white/70">
        {balance !== null && (
          <>Balance: {(Number(balance) / 1e6).toFixed(6)} USDC</>
        )}
      </div>

      {/* Message */}
      <div className="mt-5 text-left">
        <textarea
          id="message"
          rows={2}
          placeholder="Say something (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-relaxed focus:outline-none"
        />
      </div>

      {/* Buttons */}
      {isConnected ? (
        <button
          onClick={onDonate}
          disabled={isSending}
          className="mt-6 px-4 py-2 w-full rounded-2xl bg-white text-black font-semibold hover:cursor-pointer disabled:opacity-40"
        >
          {isSending ? "Processing..." : "Send tip privately"}
        </button>
      ) : (
        <button
          className="mt-6 px-4 py-2 w-full rounded-2xl bg-white text-black font-semibold hover:cursor-pointer disabled:opacity-40"
          onClick={openConnectModal}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default DonateForm;
