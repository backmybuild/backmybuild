"use server";
import "server-only";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import prisma from "@fuelme/database";
import { CHAIN, publicClient } from "@fuelme/defination";
import { ACCOUNT_SEEDS, PRIVATE_KEY } from "@fuelme/defination/server";
import { checkStealthAddress, computeViewingKey } from "@fuelme/stealth";
import {
  Address,
  createWalletClient,
  Hex,
  hexToString,
  http,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const walletClient = createWalletClient({
  account: privateKeyToAccount(PRIVATE_KEY),
  chain: CHAIN,
  transport: http(),
});

export type DonateInformation = {
  to: Address;
  viewTag: Hex;
  ephemeralPublicKey: Hex;
  message: string;
};

export type TransferInformation = {
  from: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  signature: Hex;
};

export const donate = async (
  donateInformation: DonateInformation,
  transferInformation: TransferInformation
): Promise<Hex> => {
  const { request } = await publicClient.simulateContract({
    abi: FUELME_ABI,
    address: FUELME_ADDRESSES[CHAIN.id],
    functionName: "donate",
    args: [
      {
        ...donateInformation,
      },
      {
        ...transferInformation,
      },
    ],
  });
  const tx = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return tx;
};
