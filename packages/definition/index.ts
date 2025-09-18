import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
  parseUnits,
  type Abi,
  type Address,
  type Hex,
} from "viem";
import {
  abstract,
  apeChain,
  arbitrum,
  base,
  baseSepolia,
  berachain,
  blast,
  bsc,
  celo,
  cronos,
  fraxtal,
  linea,
  mainnet,
  mantle,
  moonbeam,
  opBNB,
  optimism,
  polygonZkEvm,
  scroll,
  sei,
  sonic,
  sophon,
  swellchain,
  taiko,
  unichain,
  worldchain,
  xdc,
  zksync,
} from "viem/chains";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
// const CHAIN = IS_PRODUCTION ? base : baseSepolia;
const CHAIN = baseSepolia; // For testing purpose, always use Sepolia
const USDC_ADDRESS =
  (process.env.USDC_ADDRESS as Hex) ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Sepolia USDC
const TRANSFER_FEE = parseUnits("0.01", 6);
const FEE_ADDRESS: Address = "0x704edAab548655c2958D8A7fe58642b31dB4FB28";
const REQUEST_VIEWING_KEY_MESSAGE = "Request viewing key";
const STEALTH_SIGN_MESSAGE = `
Stealth.Giving Protocol.
Sign this message to unlock your stealth profile. 
This won't cost any gas or FEE and won't perform any on-chain actions.
Remember, DON'T SHARE this signature with anyone!
`;
const ANNOUNCER_ADDRESS: Address = "0x55649E01B5Df198D18D95b5cc5051630cfD45564";
const STEALTH_ADDRESS: Address = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // Uniswap V3 as placeholder
const ANNOUNCER_EVENT = parseAbiItem(
  "event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes ephemeralPubKey, bytes metadata)"
);
const SUPPORT_CHAINS = IS_PRODUCTION
  ? [
      mainnet,
      bsc,
      arbitrum,
      optimism,
      base,
      celo,
      polygonZkEvm,
      linea,
      moonbeam,
      scroll,
      zksync,
      opBNB,
      fraxtal,
      blast,
      cronos,
      mantle,
      taiko,
      worldchain,
      xdc,
      apeChain,
      sophon,
      unichain,
      berachain,
      swellchain,
      sonic,
      abstract,
      sei,
    ]
  : [baseSepolia];

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(),
});

export {
  // IS_PRODUCTION,
  TRANSFER_FEE,
  FEE_ADDRESS,
  CHAIN,
  REQUEST_VIEWING_KEY_MESSAGE,
  USDC_ADDRESS,
  publicClient,
  STEALTH_SIGN_MESSAGE,
  ANNOUNCER_ADDRESS,
  ANNOUNCER_EVENT,
  SUPPORT_CHAINS,
};
