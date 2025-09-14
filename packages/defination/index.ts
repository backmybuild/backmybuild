import { createPublicClient, createWalletClient, http, parseUnits, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// const IS_PRODUCTION = process.env.NODE_ENV === "production";
// const CHAIN = IS_PRODUCTION ? base : baseSepolia;
const CHAIN = baseSepolia; // For testing purpose, always use Sepolia
const USDC_ADDRESS = process.env.USDC_ADDRESS as Hex || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Sepolia USDC
const TRANSFER_FEE = parseUnits("0.01", 6)
const FEE_ADDRESS: Address = "0x704edAab548655c2958D8A7fe58642b31dB4FB28"
const REQUEST_VIEWING_KEY_MESSAGE = "Request viewing key"
const STEALTH_SIGN_MESSAGE = `
Stealth.Giving Protocol.
Sign this message to unlock your stealth profile. 
This won't cost any gas or FEE and won't perform any on-chain actions.
Remember, DON'T SHARE this signature with anyone!
`;

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http()
})

export {
  // IS_PRODUCTION,
  TRANSFER_FEE,
  FEE_ADDRESS,
  CHAIN,
  REQUEST_VIEWING_KEY_MESSAGE,
  USDC_ADDRESS,
  publicClient,
  STEALTH_SIGN_MESSAGE
}