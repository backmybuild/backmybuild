"use server";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

const walletClient = createWalletClient({
  account: privateKeyToAccount(PRIVATE_KEY || "0x"),
  chain: baseSepolia,
  transport: http(),
});

export const updateProfile = async (usernameHash: Hex, key: Hex, profile: Hex, nonce: bigint, signature: Hex): Promise<Hex> => {
  const txHash = await walletClient.writeContract({
    address: FUELME_ADDRESSES[baseSepolia.id] as Hex,
    abi: FUELME_ABI,
    functionName: "updateProfile",
    args: [
      usernameHash,
      key,
      profile,
      nonce,
      signature,
    ],
    gas: 1_000_000n,
  });

  return txHash
};
