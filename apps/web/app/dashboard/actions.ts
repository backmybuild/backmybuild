"use server";
import "server-only";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { getServerSession } from "next-auth";
import { Hex } from "thirdweb";
import {
  Address,
  createWalletClient,
  hashMessage,
  http,
  keccak256,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, publicClient } from "@fuelme/defination";
import { ACCOUNT_SEEDS, PRIVATE_KEY } from "@fuelme/defination/server";
import { uploadImage } from "../../services/uploadImage";
import {
  computeViewingKey,
  generateSpendingKeyFromSignature,
  getEncryptionPublicKey,
  STEALTH_SIGN_MESSAGE,
} from "@fuelme/stealth";
import prisma from "@fuelme/database";

export const getSpendingAddress = async (): Promise<Address> => {
  const user = await getServerSession();
  if (!user?.user?.email) {
    throw new Error("User not authenticated");
  }
  const userPrivateKey = hashMessage(user?.user?.email + ACCOUNT_SEEDS);
  const account = privateKeyToAccount(userPrivateKey);
  return account.address;
};

export const updateProfile = async (
  username: string,
  fullname: string,
  avatar: string,
  bio: string,
  links: string[]
): Promise<Hex> => {
  const user = await getServerSession();
  if (!user?.user?.email) {
    throw new Error("User not authenticated");
  }
  const userPrivateKey = hashMessage(user?.user?.email + ACCOUNT_SEEDS);
  const authorizedAccount = privateKeyToAccount(userPrivateKey);
  const authorizedSignature = await authorizedAccount.signMessage({
    message: STEALTH_SIGN_MESSAGE,
  });
  const spendingKey = generateSpendingKeyFromSignature(authorizedSignature);

  let avatarUpload: string = avatar;
  if (avatar.startsWith("data:")) {
    avatarUpload = await uploadImage(avatar, {
      kind: "avatar",
    });
  }
  const profile = stringToHex(
    [fullname, avatarUpload, links.join(","), bio || ""].join("|")
  );
  const encryptionPublicKey = getEncryptionPublicKey(userPrivateKey.slice(2));
  const viewingKey = computeViewingKey(
    stringToHex(ACCOUNT_SEEDS),
    authorizedAccount.address
  );
  const key = stringToHex(
    [spendingKey.publicKey, viewingKey.publicKey, encryptionPublicKey].join("|")
  );

  const nonce = BigInt(new Date().valueOf());

  const createProfileSignature = await authorizedAccount.signTypedData({
    domain: {
      name: "FuelMe",
      version: "1",
      chainId: CHAIN.id,
      verifyingContract: FUELME_ADDRESSES[CHAIN.id] as Address,
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

  const walletClient = createWalletClient({
    account: privateKeyToAccount(PRIVATE_KEY),
    chain: CHAIN,
    transport: http(),
  });

  const txHash = await walletClient.writeContract({
    address: FUELME_ADDRESSES[CHAIN.id] as Address,
    abi: FUELME_ABI,
    functionName: "updateProfile",
    args: [stringToHex(username), key, profile, nonce, createProfileSignature],
    gas: 1_000_000n,
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
};

export const getUserBalanceAndTransaction = async () => {
  const user = await getServerSession();
  if (!user?.user?.email) {
    throw new Error("User not authenticated");
  }

  const userPrivateKey = hashMessage(user?.user?.email + ACCOUNT_SEEDS);
  const authorizedAccount = privateKeyToAccount(userPrivateKey);
  const authorizedAddress = authorizedAccount.address;

  const txs = await prisma.transaction.findMany({
    where: { authorizedAddress },
    orderBy: { createdAt: "desc" },
  });

  const recv = await prisma.transaction.aggregate({
    where: { authorizedAddress, isActive: true, type: "RECEIVE" },
    _sum: { amountWei: true },
  });
  let balance = BigInt(recv._sum.amountWei?.toFixed() ?? 0);
  return {
    balance,
    txs: txs.map((t) => ({ 
      ...t,
      type: t.type as "WITHDRAW" | "RECEIVE",
      amountWei: BigInt(t.amountWei.toFixed(0)) 
    })),
  };
};
