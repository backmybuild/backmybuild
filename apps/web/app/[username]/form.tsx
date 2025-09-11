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
  keccak256,
  parseAbiParameters,
  parseUnits,
  stringToHex,
  toHex,
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
  const [amount, setAmount] = useState("");
  const { signTypedDataAsync } = useSignTypedData();
  const amt = useMemo(() => (amount ? Number(amount) : NaN), [amount]);
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

  const onDonate = async () => {
    try {
      if (
        !isConnected ||
        !address ||
        !isValid ||
        !stealthKey ||
        !currentChainId
      )
        return;
      if (currentChainId !== CHAIN.id) {
        await switchChainAsync({
          chainId: CHAIN.id,
        });
      }
      const newStealthAddress = generateStealthAddress(
        stealthKey.spendingPublicKey,
        stealthKey.viewingPublicKey
      );

      const encryptedMessage = encryptSymmetric(stealthKey.encryptionPublicKey as string, message);
      const postMessage = stringToHex(
        [
          encryptedMessage.nonce,
          encryptedMessage.ephemPublicKey,
          encryptedMessage.ciphertext,
        ].join("|")
      );

      const now = BigInt(Math.floor(Date.now() / 1000));

      const donationInfor = {
        to: newStealthAddress.address,
        viewTag: newStealthAddress.viewTag,
        ephemeralPublicKey: newStealthAddress.ephemeralPublicKey,
        message: postMessage,
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

      await donate(donationInfor, {
        from: address,
        value: parseUnits(amount || "0", 6),
        validAfter: now,
        validBefore: now + BigInt(3600),
        signature: donateSignature,
      });

      toast.success("Donation successful! Thank you for your support.");
    } catch (error) {
      console.error("Donation error:", error);
      toast.error("Error processing donation. Please try again.");
    }
  };

  return (
    <div>
      <label htmlFor="amount" className="mb-2 block text-sm text-white/80">
        Buy me a coffee
      </label>
      <div className="relative">
        <input
          id="amount"
          type="number"
          placeholder="1.00"
          value={amount}
          onChange={(e) => setAmount(formatEth(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 pr-20 text-lg focus:outline-none"
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-white/70">
          USDC
        </span>
      </div>
      <div className="mt-2 text-right text-xs text-white/70">
        {balance !== null && (
          <>Balance: {(Number(balance) / 1e6).toFixed(6)} USDC</>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-5 text-left">
        <textarea
          id="message"
          rows={2}
          placeholder={`Say something nice to ${fullname || username}... (optional)`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-relaxed focus:outline-none"
        />
      </div>
      {isConnected ? (
        <button
          onClick={onDonate}
          disabled={
            !isValid ||
            (balance !== null && balance < BigInt(amt * 1e6)) ||
            !amount
          }
          className="mt-6 w-full rounded-2xl bg-white text-black px-6 py-4 text-lg font-semibold disabled:opacity-40"
        >
          Buy me a coffee
        </button>
      ) : (
        <div className="mb-4 text-center text-sm text-white/70 flex">
          <button
            className="mt-6 w-full rounded-2xl bg-white text-black px-6 py-4 text-lg font-semibold disabled:opacity-40"
            onClick={openConnectModal}
          >
            Connect Wallet to Donate
          </button>
        </div>
      )}
    </div>
  );
};

export default DonateForm;
