import {
  checkStealthAddress,
  computeStealthPrivateKey,
  computeViewingKey,
  encryptSymmetric,
  generateSpendingKeyFromSignature,
  generateStealthAddress,
  getEncryptionPublicKey,
  STEALTH_SIGN_MESSAGE,
} from "@fuelme/stealth";
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  erc20Abi,
  getAddress,
  hashMessage,
  hexToBigInt,
  hexToString,
  http,
  keccak256,
  numberToHex,
  parseAbi,
  parseAbiItem,
  parseAbiParameters,
  parseEther,
  parseEventLogs,
  recoverTypedDataAddress,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import {
  english,
  generateMnemonic,
  generatePrivateKey,
  mnemonicToAccount,
  privateKeyToAccount,
  publicKeyToAddress,
} from "viem/accounts";
import { FUELME_ADDRESSES, FUELME_ABI } from "@fuelme/contracts";
import { anvil, baseSepolia, localhost } from "viem/chains";

const PRIVATE_SEEDS = process.env.PRIVATE_SEEDS ?? "test";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const testDonate = async () => {
  const forwarder = createWalletClient({
    account: privateKeyToAccount((process.env.PRIVATE_KEY as Hex) || "0x"),
    chain: baseSepolia,
    transport: http(),
  });

  const fuelMeAddress = FUELME_ADDRESSES[baseSepolia.id];
  
  const mnemonic = process.env.MNEMONIC ?? generateMnemonic(english);

  const user1Account = privateKeyToAccount(
    (process.env.PRIVATE_KEY as Hex) || "0x"
  );
  const user2Account = privateKeyToAccount(
    (process.env.PRIVATE_KEY as Hex) || "0x"
  );

  const USDC = (await client.readContract({
    address: fuelMeAddress,
    abi: FUELME_ABI,
    functionName: "USDC",
  })) as Address;
  console.log("USDC Address:", USDC);
  console.log("User Address:", user1Account.address);
  console.log("Donate 0.1USDC from User Account To Test Account");

  const donateInformation = {
    to: user2Account.address,
    viewTag: 2,
    ephemeralPublicKey: "0x",
    message: "0x",
  };

  const donateHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        "address to, uint16 viewTag, bytes ephemeralPublicKey, bytes message"
      ),
      [
        donateInformation.to,
        donateInformation.viewTag,
        donateInformation.ephemeralPublicKey,
        donateInformation.message,
      ] as any
    )
  );

  const transferInformation = {
    from: user1Account.address,
    value: 10000000n,
    validAfter: 0n,
    validBefore: 100000000000000n,
  };

  const transferSignature = await user1Account.signTypedData({
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
      chainId: 84532n,
      verifyingContract: getAddress(USDC),
    },
    message: {
      from: transferInformation.from,
      to: fuelMeAddress,
      value: transferInformation.value,
      validAfter: transferInformation.validAfter,
      validBefore: transferInformation.validBefore,
      nonce: donateHash,
    },
  });
  const { request } = await client.simulateContract({
    abi: FUELME_ABI,
    address: fuelMeAddress,
    functionName: "donate",
    args: [
      {
        ...donateInformation,
      },
      {
        ...transferInformation,
        signature: transferSignature,
      },
    ],
  });

  const tx = await forwarder.writeContract(request);

  console.log(tx);

  const balanceUser2 = await client.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [user2Account.address],
  });

  console.log("User2 USDC Balance:", balanceUser2);
};

// testDonate();

const testTransfer = async () => {
  const forwarder = createWalletClient({
    account: privateKeyToAccount((process.env.PRIVATE_KEY as Hex) || "0x"),
    chain: baseSepolia,
    transport: http(),
  });

  const fuelMeAddress = FUELME_ADDRESSES[baseSepolia.id];
  
  const mnemonic = process.env.MNEMONIC ?? generateMnemonic(english);

  const user1Account = privateKeyToAccount(
    (process.env.PRIVATE_KEY as Hex) || "0x"
  );
  const user2Account = privateKeyToAccount(
    (process.env.PRIVATE_KEY as Hex) || "0x"
  );

  const USDC = (await client.readContract({
    address: fuelMeAddress,
    abi: FUELME_ABI,
    functionName: "USDC",
  })) as Address;

  const transferInformation = {
    from: user1Account.address,
    to: user2Account.address,
    value: 10000000n,
    validAfter: 0n,
    validBefore: 100000000000000n,
    nonce: keccak256(generatePrivateKey())
  };

  const transferSignature = await user1Account.signTypedData({
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
      verifyingContract: getAddress(USDC),
    },
    message: {
      from: transferInformation.from,
      to: transferInformation.to,
      value: transferInformation.value,
      validAfter: transferInformation.validAfter,
      validBefore: transferInformation.validBefore,
      nonce: transferInformation.nonce,
    },
  });
  const { request } = await client.simulateContract({
    abi: FUELME_ABI,
    address: fuelMeAddress,
    functionName: "multipleTransferAuthorized",
    args: [
      [
        {
          ...transferInformation,
          signature: transferSignature
        }
      ]
    ],
  });

  const tx = await forwarder.writeContract(request);

  console.log(tx);

  const balanceUser2 = await client.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [user2Account.address],
  });

  console.log("User2 USDC Balance:", balanceUser2);
};

testTransfer()

const testFull = async () => {
  const mnemonic = process.env.MNEMONIC ?? generateMnemonic(english);
  const userAccount = mnemonicToAccount(mnemonic, {
    addressIndex: 0,
  });
  const forwarder = createWalletClient({
    account: mnemonicToAccount(mnemonic, {
      addressIndex: 1,
    }),
    chain: anvil,
    transport: http(),
  });

  const signature = await userAccount.signMessage({
    message: STEALTH_SIGN_MESSAGE,
  });

  const spendingKey = generateSpendingKeyFromSignature(signature);
  const authorizeAccount = privateKeyToAccount(spendingKey.privateKey);
  const viewingKey = computeViewingKey(
    stringToHex(PRIVATE_SEEDS),
    authorizeAccount.address
  );

  console.log("mnemonic:", mnemonic);
  console.log("spendingKey:", spendingKey);
  console.log("viewingKey:", viewingKey);

  const fuelMeAddress = FUELME_ADDRESSES[anvil.id];

  const userInformation = {
    username: hashMessage("testuser"),
    fullName: "Test User",
    bio: "This is a test user",
    links: ["https://example.com", "https://twitter.com/testuser"],
    avatar: "https://example.com/avatar.png",
    spendingKey: spendingKey,
    viewingKey: viewingKey,
  };

  const profile = stringToHex(
    [
      userInformation.fullName,
      userInformation.bio,
      userInformation.links.join(","),
      userInformation.avatar,
    ].join("|")
  );

  const encryptionPublicKey = getEncryptionPublicKey(
    spendingKey.privateKey.slice(2)
  );
  const key = stringToHex(
    [spendingKey.publicKey, viewingKey.publicKey, encryptionPublicKey].join("|")
  );
  const nonce = BigInt(new Date().valueOf());

  console.log("profile:", profile);
  console.log("key:", key);

  const createProfileSignature = await authorizeAccount.signTypedData({
    domain: {
      name: "FuelMe",
      version: "1",
      chainId: anvil.id,
      verifyingContract: fuelMeAddress,
    },
    types: {
      UpdateProfile: [
        { name: "username", type: "bytes32" },
        { name: "key", type: "bytes" },
        { name: "profile", type: "bytes" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "UpdateProfile",
    message: {
      username: userInformation.username,
      key: key,
      profile: profile,
      nonce: nonce,
    },
  });

  const setupAccountTx = await forwarder.writeContract({
    address: fuelMeAddress,
    abi: FUELME_ABI,
    functionName: "updateProfile",
    args: [
      userInformation.username,
      key,
      profile,
      nonce,
      createProfileSignature,
    ],
    gas: 1_000_000n,
  });
  await client.waitForTransactionReceipt({ hash: setupAccountTx });

  const userProfile = (await client.readContract({
    address: fuelMeAddress,
    abi: FUELME_ABI,
    functionName: "getProfile",
    args: [userInformation.username],
  })) as any;

  console.log("Key:", hexToString(userProfile[0]));
  console.log("Profile:", hexToString(userProfile[1]));

  const user2 = createWalletClient({
    account: mnemonicToAccount(mnemonic, {
      addressIndex: 2,
    }),
    chain: anvil,
    transport: http(),
  });

  const stealth = generateStealthAddress(
    spendingKey.publicKey,
    viewingKey.publicKey
  );
  const message = "Hello, Fuelme!";
  const encryptedMessage = encryptSymmetric(encryptionPublicKey, message);

  const postMessage = stringToHex(
    [
      encryptedMessage.nonce,
      encryptedMessage.ephemPublicKey,
      encryptedMessage.ciphertext,
    ].join("|")
  );

  const donateTx = await user2.writeContract({
    address: fuelMeAddress,
    abi: FUELME_ABI,
    functionName: "announce",
    args: [
      stealth.address,
      hexToBigInt(stealth.viewTag),
      stealth.ephemeralPublicKey,
      postMessage,
    ],
    value: parseEther("1"),
  });

  const receipt = await client.waitForTransactionReceipt({ hash: donateTx });
  console.log("Donate tx:", receipt);

  const parsedLog = parseEventLogs({
    abi: FUELME_ABI,
    logs: receipt.logs,
  });
  console.log("Parsed log:", parsedLog);
  const log: any = parsedLog.find((l: any) => l.eventName === "Announcement");

  const isValidStealthAddress = checkStealthAddress(
    log.args.stealthAddress,
    log.args.ephemeralPublicKey,
    spendingKey.publicKey,
    viewingKey.privateKey,
    numberToHex(log.args.viewTag)
  );
  console.log("isValidStealthAddress:", isValidStealthAddress);

  const stealthPrivateKey = computeStealthPrivateKey(
    {
      viewingKey: viewingKey,
      spendingKey: spendingKey,
    },
    log.args.ephemeralPublicKey
  );

  const stealthAddress = privateKeyToAccount(stealthPrivateKey);

  console.log(
    "Stealth Balance",
    await client.getBalance({ address: stealthAddress.address })
  );

  console.log("Stealth Address:", stealthAddress.address);
};
