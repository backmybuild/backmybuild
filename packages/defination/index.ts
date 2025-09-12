import { createPublicClient, createWalletClient, http, parseUnits, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// const IS_PRODUCTION = process.env.NODE_ENV === "production";
// const CHAIN = IS_PRODUCTION ? base : baseSepolia;
const CHAIN = baseSepolia; // For testing purpose, always use Sepolia
const USDC_ADDRESS = process.env.USDC_ADDRESS as Hex || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Sepolia USDC
const TRANSFER_FEE = parseUnits("0.01", 6)
const FEE_ADDRESS: Address = "0x704edAab548655c2958D8A7fe58642b31dB4FB28"

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http()
})


export {
  // IS_PRODUCTION,
  TRANSFER_FEE,
  FEE_ADDRESS,
  CHAIN,
  USDC_ADDRESS,
  publicClient,
}