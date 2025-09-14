import type { Address } from "viem"
import StealthBuild from "./out/Stealth.sol/Stealth.json"
import FuelMeBaseSepoliaBroadcasted from "./broadcast/DeployStealth.s.sol/84532/run-latest.json"
// import FuelMeLocalBroadcasted from "./broadcast/DeployStealth.s.sol/31337/run-latest.json"
import { anvil, baseSepolia } from "viem/chains"

export const FUELME_ABI = StealthBuild.abi
export const FUELME_ADDRESSES = {
  [baseSepolia.id]: (FuelMeBaseSepoliaBroadcasted as any).transactions[0].contractAddress as Address,
  // [anvil.id]: (FuelMeLocalBroadcasted as any).transactions[0].contractAddress as Address,
}