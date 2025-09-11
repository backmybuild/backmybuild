import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// const IS_PRODUCTION = process.env.NODE_ENV === "production";
// const CHAIN = IS_PRODUCTION ? base : baseSepolia;
const CHAIN = baseSepolia; // For testing purpose, always use Sepolia
const USDC_ADDRESS = process.env.USDC_ADDRESS as Hex || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Sepolia USDC

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http()
})


export {
  // IS_PRODUCTION,
  CHAIN,
  USDC_ADDRESS,
  publicClient,
}