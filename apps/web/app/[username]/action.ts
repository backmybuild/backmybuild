"use server";
import "server-only";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import prisma from "@fuelme/database";
import { CHAIN, publicClient, TRANSFER_FEE } from "@fuelme/defination";
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
  username: string,
  donateInformation: DonateInformation,
  transferInformation: TransferInformation
): Promise<Hex> => {
  const profileEncoded = await publicClient.readContract({
    address: FUELME_ADDRESSES[CHAIN.id],
    abi: FUELME_ABI,
    functionName: "getProfile",
    args: [stringToHex(username)],
  });

  const keyData = profileEncoded ? ((profileEncoded as any)[0] as Hex) : null;
  const keys = hexToString(keyData || "0x").split("|");
  const authorizedAddress = (keys[3] || "") as Address;
  const spendingPublicKey = (keys[0] || "") as Hex;

  const viewingKey = computeViewingKey(
    stringToHex(ACCOUNT_SEEDS),
    authorizedAddress
  );
  const isOwnerOfStealthAddress = checkStealthAddress(
    donateInformation.to,
    donateInformation.ephemeralPublicKey,
    spendingPublicKey, // spendingPublicKey
    viewingKey.privateKey, // viewingPrivateKey
    donateInformation.viewTag
  );

  if (!isOwnerOfStealthAddress) {
    throw new Error("Invalid stealth address");
  }
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

  await prisma.transaction.create({
    data: {
      type: "RECEIVE",
      authorizedAddress,
      address: donateInformation.to,
      ephemeralPublicKey: donateInformation.ephemeralPublicKey,
      amountWei: (transferInformation.value * BigInt(97) / BigInt(100)).toString(),
      txHash: tx,
      message: donateInformation.message || "",
      chain: CHAIN.id.toString(),
    },
  });

  return tx;
};
