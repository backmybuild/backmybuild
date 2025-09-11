"use server"
import { computeViewingKey, Key } from "@fuelme/stealth";
import { Address, Hex, stringToHex, verifyMessage } from "viem";

const PRIVATE_SEEDS = process.env.PRIVATE_SEEDS ?? "test";

export const generateViewingKey = async (authorizeAddress: Address, signature: Hex): Promise<Key> => {
  const isValidSignature = await verifyMessage({
    address: authorizeAddress,
    message: "FuelMe Authorization",
    signature,
  })

  if (!isValidSignature) {
    throw new Error("Invalid signature");
  }

  return computeViewingKey(stringToHex(PRIVATE_SEEDS), authorizeAddress);
}