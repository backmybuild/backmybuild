import { createWalletClient, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex || generatePrivateKey();
const ACCOUNT_SEEDS = process.env.ACCOUNT_SEEDS || "HELLO_FUELME";
const OPT_SEEDS = process.env.OPT_SEEDS || "OPT_FUELME";

export {
  PRIVATE_KEY,
  ACCOUNT_SEEDS,
  OPT_SEEDS
}