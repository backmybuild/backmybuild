"use server";
import "server-only";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { getServerSession } from "next-auth";
import {
  Address,
  createWalletClient,
  erc20Abi,
  formatUnits,
  getAddress,
  hashMessage,
  http,
  PrivateKeyAccount,
  stringToHex,
  Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  CHAIN,
  FEE_ADDRESS,
  publicClient,
  TRANSFER_FEE,
  USDC_ADDRESS,
} from "@fuelme/defination";
import {
  ACCOUNT_SEEDS,
  OPT_SEEDS,
  PRIVATE_KEY,
  mailer,
} from "@fuelme/defination/server";
import { uploadImage } from "../../services/uploadImage";
import {
  computeStealthPrivateKey,
  computeViewingKey,
  generateSpendingKeyFromSignature,
  getEncryptionPublicKey,
  STEALTH_SIGN_MESSAGE,
  StealthKey,
} from "@fuelme/stealth";
import prisma from "@fuelme/database";
import { totp } from "otplib";

totp.options = {
  step: 60 * 5, // valid for 60s (RFC-6238 default is 30s, you can choose)
  digits: 6, // 6-digit code
};

export const getSpendingAddress = async (): Promise<Address> => {
  const user = await getServerSession();
  if (!user?.user?.email) {
    throw new Error("User not authenticated");
  }
  const userPrivateKey = hashMessage(user?.user?.email + ACCOUNT_SEEDS);
  const account = privateKeyToAccount(userPrivateKey);
  return account.address;
};

const getStealtKey = async (
  authorizedAccount: PrivateKeyAccount
): Promise<StealthKey> => {
  const authorizedSignature = await authorizedAccount.signMessage({
    message: STEALTH_SIGN_MESSAGE,
  });
  const spendingKey = generateSpendingKeyFromSignature(authorizedSignature);
  const viewingKey = computeViewingKey(
    stringToHex(ACCOUNT_SEEDS),
    authorizedAccount.address
  );

  return {
    spendingKey,
    viewingKey,
  };
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
    [
      spendingKey.publicKey,
      viewingKey.publicKey,
      encryptionPublicKey,
      authorizedAccount.address,
    ].join("|")
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
    take: 100,
  });

  const totalTxs = await prisma.transaction.count({
    where: { authorizedAddress },
  });

  const activeAddresses = await prisma.transaction.findMany({
    where: { authorizedAddress, isActive: true },
    select: { address: true },
    distinct: ["address"],
    orderBy: { address: "asc" },
  });

  const balances = await publicClient.multicall({
    contracts: activeAddresses.map((row: any) => ({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [row.address],
    })),
  });
  const balance = balances.reduce(
    (acc, cur: any) => acc + BigInt(cur.result || 0n),
    0n
  );
  return {
    balance,
    txs: txs.map((t) => ({
      ...t,
      type: t.type.toString(),
      amountWei: BigInt(t.amountWei.toFixed(0)),
    })),
    totalTxs,
  };
};

export const requestTransferOTP = async (receiver: Address, amount: bigint) => {
  const user = await getServerSession();
  if (!user?.user?.email) {
    throw new Error("User not authenticated");
  }

  const otpSeeds = hashMessage(
    user?.user?.email + OPT_SEEDS + receiver + amount.toString()
  );
  const otp = totp.generate(otpSeeds);
  const formattedAmount = formatUnits(amount, 6); // assume USDC (6 decimals)

  const subject = "Your Stealth.Giving transfer OTP";
  const text = `Your OTP is: ${otp}
  
It expires in  5 minutes.  
Receiver: ${receiver}  
Amount: ${formattedAmount}  

If you didn’t request this, ignore this email.`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
      <p style="margin:0 0 16px">Use this code to confirm your withdrawal:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:3px;
                  padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;
                  display:inline-block">
        ${otp}
      </div>
      <p style="margin:16px 0 8px;color:#6b7280">Expires in 30 seconds.</p>

      <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb" />

      <p style="margin:0 0 6px"><strong>Receiver:</strong> ${receiver}</p>
      <p style="margin:0 0 6px"><strong>Amount:</strong> ${formattedAmount} USDC</p>
    </div>
  `;

  return mailer.sendMail({
    from: process.env.SMTP_FROM!,
    to: user.user.email,
    subject,
    text,
    html,
  });
};

export const calculateTransferParams = async (
  stealthKey: StealthKey,
  ephemeralPublicKey: Hex,
  to: Address,
  amount: bigint
) => {
  const validAfter = 0n;
  const validBefore = 100000000000n;
  const stealthPrivateKey = computeStealthPrivateKey(
    stealthKey,
    ephemeralPublicKey as Hex
  );

  const fromAccount = privateKeyToAccount(stealthPrivateKey);
  const randomNonce = generatePrivateKey();
  const transferSignature = await fromAccount.signTypedData({
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    domain: {
      name: "USDC",
      version: "2",
      chainId: 84532n,
      verifyingContract: getAddress(USDC_ADDRESS),
    },
    message: {
      from: fromAccount.address,
      to: to,
      value: amount,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: randomNonce,
    },
  });

  return {
    from: fromAccount.address,
    to: to,
    value: amount,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: randomNonce,
    signature: transferSignature,
  };
};

export const handleSendUSDC = async (
  receiver: Address,
  amount: bigint,
  otp: string
): Promise<Hex> => {
  const user = await getServerSession();
  if (!user?.user?.email) {
    throw new Error("User not authenticated");
  }
  const otpSeeds = hashMessage(
    user?.user?.email + OPT_SEEDS + receiver + amount.toString()
  );
  const isValidOtp = totp.verify({
    token: otp,
    secret: otpSeeds,
  });

  if (!isValidOtp) {
    throw new Error("Invalid OTP");
  }

  const authorizedAccount = privateKeyToAccount(
    hashMessage(user?.user?.email + ACCOUNT_SEEDS)
  );
  const authorizedAddress = authorizedAccount.address;

  const rows = await prisma.transaction.findMany({
    where: { authorizedAddress, isActive: true },
    select: { address: true, ephemeralPublicKey: true },
    distinct: ["address"],
    orderBy: { address: "asc" },
  });

  const balances = await publicClient.multicall({
    contracts: rows.map((row) => ({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [row.address],
    })),
  });

  const useRows: {
    address: string;
    ephemeralPublicKey: string | null;
    balance: bigint;
  }[] = [];
  let accumulated = 0n;
  for (let i = 0; i < rows.length; i++) {
    const bal = BigInt(balances[i].result || 0n);
    if (bal > 0n) {
      accumulated += bal;
      useRows.push({
        ...rows[i],
        balance: bal,
      });
    }
    if (accumulated >= amount + TRANSFER_FEE) {
      break;
    }
  }

  if (accumulated < amount + TRANSFER_FEE) {
    throw new Error("Insufficient balance");
  }

  const stealthKey = await getStealtKey(authorizedAccount);
  const forwardingRows = useRows[0];

  const transfers: any = [];
  const deactiveAddresses: string[] = [];
  for (let i = 1; i < useRows.length; i++) {
    const row = useRows[i];
    const transfer = await calculateTransferParams(
      stealthKey,
      row.ephemeralPublicKey! as Hex,
      forwardingRows.address as Address,
      row.balance
    );

    deactiveAddresses.push(row.address);
    transfers.push(transfer);
  }

  const transferToFeeAddress = await calculateTransferParams(
    stealthKey,
    forwardingRows.ephemeralPublicKey! as Hex,
    FEE_ADDRESS,
    TRANSFER_FEE
  );
  transfers.push(transferToFeeAddress);

  const transferToReceiver = await calculateTransferParams(
    stealthKey,
    forwardingRows.ephemeralPublicKey! as Hex,
    receiver,
    amount
  );
  transfers.push(transferToReceiver);

  const walletClient = createWalletClient({
    account: privateKeyToAccount(PRIVATE_KEY),
    chain: CHAIN,
    transport: http(),
  });

  const { request } = await publicClient.simulateContract({
    abi: FUELME_ABI,
    address: FUELME_ADDRESSES[CHAIN.id] as Address,
    functionName: "multipleTransferAuthorized",
    args: [transfers],
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  await prisma.transaction.updateMany({
    where: { address: { in: deactiveAddresses } },
    data: { isActive: false },
  });
  await prisma.transaction.create({
    data: {
      authorizedAddress,
      address: forwardingRows.address,
      amountWei: amount.toString(),
      type: "WITHDRAW",
      txHash,
      isActive: true,
      chain: CHAIN.id.toString(),
    },
  });

  return txHash;
};
