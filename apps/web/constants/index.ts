import { Address } from "viem";

const IS_DEV = process.env.NODE_ENV == "development";
const SHOWRA_ADDRESS: Address = IS_DEV
  ? "0xAE086DfB5A2D678eF2C80F20F6b6b784BA1cb529"
  : "0xa371f8789a0eda046f913df0fdb3076601633054"; // Mainnet address
const GALLERY_REGISTRATION_FEE = "0.001"; // in ETH

export * from "./showra.abi";
export { SHOWRA_ADDRESS, GALLERY_REGISTRATION_FEE, IS_DEV };
