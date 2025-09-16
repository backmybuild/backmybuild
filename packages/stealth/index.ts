import {
  getPublicKey,
  getSharedSecret,
  ProjectivePoint,
  utils,
  CURVE,
} from "@noble/secp256k1";
import {
  bytesToHex,
  getAddress,
  hashMessage,
  hexToBytes,
  hexToNumber,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import { publicKeyToAddress } from "viem/accounts";
import { base64, utf8 } from "@scure/base";
import nacl from "tweetnacl";

export interface Key {
  publicKey: Hex;
  privateKey: Hex;
}

export interface StealthKey {
  viewingKey: Key;
  spendingKey: Key;
}

export interface StealthAddress {
  address: Address;
  ephemeralPublicKey: Hex;
  viewTag: Hex;
}

export const STEALTH_SIGN_MESSAGE = `
FuelMe Protocol.
Sign this message to generate your stealth keys. 
This won't cost any gas or FEE and won't perform any on-chain actions.
Remember, DON'T SHARE this signature with anyone!
`;

const extractPortions = (signature: Hex) => {
  const startIndex = 2; // first two characters are 0x, so skip these
  const length = 64; // each 32 byte chunk is in hex, so 64 characters
  const portion1 = signature.slice(startIndex, startIndex + length);
  const portion2 = signature.slice(
    startIndex + length,
    startIndex + length + length
  );
  const lastByte = signature.slice(signature.length - 2);

  return { portion1, portion2, lastByte };
};

/**
 * Generate private keys from the signature of a message.
 *
 * This code is based on the logic and code from umbra-js (https://github.com/ScopeLift/umbra-protocol).
 *
 * @param signature
 * @returns private keypair
 */
export const generateStealthKeyFromSignature = (signature: Hex): StealthKey => {
  const { portion1, portion2, lastByte } = extractPortions(signature);

  if (`0x${portion1}${portion2}${lastByte}` !== signature) {
    throw new Error("Signature incorrectly generated or parsed");
  }

  const spendingPrivateKey = hexToBytes(keccak256(`0x${portion1}`));
  const viewingPrivateKey = hexToBytes(keccak256(`0x${portion2}`));

  const spendingPublicKey = bytesToHex(getPublicKey(spendingPrivateKey, true));
  const viewingPublicKey = bytesToHex(getPublicKey(viewingPrivateKey, true));

  return {
    spendingKey: {
      publicKey: spendingPublicKey,
      privateKey: bytesToHex(spendingPrivateKey),
    },
    viewingKey: {
      publicKey: viewingPublicKey,
      privateKey: bytesToHex(viewingPrivateKey),
    },
  };
};

const getViewTag = (hashSharedSecret: Hex): Hex => {
  return `0x${hashSharedSecret.toString().substring(2, 4)}`;
};

const getStealthPublicKey = (
  spendingPublicKey: Hex,
  hashSharedSecret: Hex
): Hex => {
  const hashedSharedSecretPoint = ProjectivePoint.fromPrivateKey(
    hexToBytes(hashSharedSecret)
  );

  return bytesToHex(
    ProjectivePoint.fromHex(spendingPublicKey.slice(2))
      .add(hashedSharedSecretPoint)
      .toRawBytes(false)
  );
};

export const generateSpendingKeyFromSignature = (signature: Hex): Key => {
  const spendingPrivateKey = keccak256(signature);
  const spendingPublicKey = bytesToHex(
    getPublicKey(hexToBytes(spendingPrivateKey), true)
  );

  return {
    publicKey: spendingPublicKey,
    privateKey: spendingPrivateKey,
  };
};

export const computeViewingKey = (
  privateSeed: Hex,
  authorizeAddress: Address
): Key => {
  const viewingPrivateKey = keccak256(
    `0x${privateSeed.slice(2)}${authorizeAddress.slice(2)}`
  );
  const viewingPublicKey = bytesToHex(
    getPublicKey(hexToBytes(viewingPrivateKey), true)
  );

  return {
    publicKey: viewingPublicKey,
    privateKey: viewingPrivateKey,
  };
};

export const generateStealthAddress = (
  spendingPublicKey: Hex,
  viewingPublicKey: Hex
): StealthAddress => {
  const ephemeralPrivateKey = utils.randomPrivateKey();
  const ephemeralPublicKey = getPublicKey(ephemeralPrivateKey, true);
  const sharedSecret = getSharedSecret(
    ephemeralPrivateKey,
    ProjectivePoint.fromHex(viewingPublicKey.slice(2)).toRawBytes(true)
  );

  const hashSharedSecret = keccak256(sharedSecret);
  const viewTag = getViewTag(hashSharedSecret);

  const newStealthPublicKey = getStealthPublicKey(
    spendingPublicKey,
    hashSharedSecret
  );
  const newStealthAddress = publicKeyToAddress(newStealthPublicKey);

  return {
    address: newStealthAddress,
    ephemeralPublicKey: bytesToHex(ephemeralPublicKey),
    viewTag,
  };
};

function addPriv({ a, b }: { a: bigint; b: bigint }) {
  const curveOrderBigInt = BigInt(CURVE.n);
  return (a + b) % curveOrderBigInt;
}

export const computeStealthPrivateKey = (
  stealthKey: StealthKey,
  ephemeralPublicKey: Hex
): Hex => {
  const sharedSecret = getSharedSecret(
    hexToBytes(stealthKey.viewingKey.privateKey),
    hexToBytes(ephemeralPublicKey)
  );

  const hashSharedSecret = keccak256(sharedSecret);

  const spendingPrivateKeyBigInt = BigInt(stealthKey.spendingKey.privateKey);
  const hashedSecretBigInt = BigInt(hashSharedSecret);

  const stealthPrivateKeyBigInt = addPriv({
    a: spendingPrivateKeyBigInt,
    b: hashedSecretBigInt,
  });

  return `0x${stealthPrivateKeyBigInt.toString(16).padStart(64, "0")}` as Hex;
};

export const checkStealthAddress = (
  stealthAddress: Hex,
  ephemeralPublicKey: Hex,
  spendingPublicKey: Hex,
  viewingPrivateKey: Hex,
  viewTag: Hex
): boolean => {
  const sharedSecret = getSharedSecret(
    hexToBytes(viewingPrivateKey),
    hexToBytes(ephemeralPublicKey)
  );

  const hashSharedSecret = keccak256(sharedSecret);
  const computedViewTag = getViewTag(hashSharedSecret);

  if (hexToNumber(computedViewTag) !== hexToNumber(viewTag)) {
    return false;
  }

  const newStealthPublicKey = getStealthPublicKey(
    spendingPublicKey,
    hashSharedSecret
  );
  const newStealthAddress = publicKeyToAddress(newStealthPublicKey);

  return getAddress(stealthAddress) === getAddress(newStealthAddress);
};

export type EthEncryptedData = {
  nonce: string;
  ephemPublicKey: string;
  ciphertext: string;
};

export const encryptSymmetric = (
  publicKey: string,
  data: string
): EthEncryptedData => {
  // generate ephemeral keypair
  const ephemeralKeyPair = nacl.box.keyPair();

  // assemble encryption parameters - from string to UInt8
  let pubKeyUInt8Array: Uint8Array;
  try {
    pubKeyUInt8Array = base64.decode(publicKey);
  } catch (err) {
    throw new Error("Bad public key");
  }

  const msgParamsUInt8Array = utf8.decode(data);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // encrypt
  const encryptedMessage = nacl.box(
    msgParamsUInt8Array,
    nonce,
    pubKeyUInt8Array,
    ephemeralKeyPair.secretKey
  );

  // handle encrypted data
  const output = {
    nonce: base64.encode(nonce),
    ephemPublicKey: base64.encode(ephemeralKeyPair.publicKey),
    ciphertext: base64.encode(encryptedMessage),
  };
  // return encrypted msg data
  return output;
};

export const decryptSymmetric = (
  encryptedData: EthEncryptedData,
  privateKey: string
): string => {
  const receiverPrivateKeyUint8Array = Buffer.from(privateKey, "hex");
  const receiverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(
    receiverPrivateKeyUint8Array
  ).secretKey;

  // assemble decryption parameters
  const nonce = base64.decode(encryptedData.nonce);
  const ciphertext = base64.decode(encryptedData.ciphertext);
  const ephemPublicKey = base64.decode(encryptedData.ephemPublicKey);

  // decrypt
  const decryptedMessage = nacl.box.open(
    ciphertext,
    nonce,
    ephemPublicKey,
    receiverEncryptionPrivateKey
  );

  // return decrypted msg data
  try {
    if (!decryptedMessage) {
      throw new Error();
    }
    const output = utf8.encode(decryptedMessage);
    // TODO: This is probably extraneous but was kept to minimize changes during refactor
    if (!output) {
      throw new Error();
    }
    return output;
  } catch (err) {
    throw new Error(`Decryption failed. ${err}`);
  }
};

export const getEncryptionPublicKey = (privateKey: string): string => {
  const privateKeyUint8Array = Buffer.from(privateKey, "hex");
  const encryptionPublicKey =
    nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).publicKey;
  return base64.encode(encryptionPublicKey);
};