import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// const IS_PRODUCTION = process.env.NODE_ENV === "production";
// const CHAIN = IS_PRODUCTION ? base : baseSepolia;
const CHAIN = baseSepolia; // For testing purpose, always use Sepolia

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http()
})


export {
  // IS_PRODUCTION,
  CHAIN,
  publicClient,
}