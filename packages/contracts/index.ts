import type { Address } from "viem"
import FuelMeBuild from "./out/Fuelme.sol/Fuelme.json"
import FuelMeBaseSepoliaBroadcasted from "./broadcast/DeployFuelme.s.sol/84532/run-latest.json"
import FuelMeLocalBroadcasted from "./broadcast/DeployFuelme.s.sol/31337/run-latest.json"
import { anvil, baseSepolia } from "viem/chains"

export const FUELME_ABI = FuelMeBuild.abi
export const FUELME_ADDRESSES = {
  [baseSepolia.id]: (FuelMeBaseSepoliaBroadcasted as any).transactions[0].contractAddress as Address,
  [anvil.id]: (FuelMeLocalBroadcasted as any).transactions[0].contractAddress as Address,
}