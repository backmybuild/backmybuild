"use server";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { CHAIN, publicClient } from "@fuelme/defination";
import { PRIVATE_KEY } from "@fuelme/defination/server";
import "server-only";
import {
  Address,
  createPublicClient,
  createWalletClient,
  Hex,
  http,
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
  await publicClient.waitForTransactionReceipt({ hash: tx });
  return tx;
};
