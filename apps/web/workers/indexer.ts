/// <reference lib="webworker" />
import { checkStealthAddress, decryptSymmetric } from "@stealthgiving/stealth";
import {
  ANNOUNCER_ADDRESS,
  ANNOUNCER_EVENT,
  CHAIN,
  publicClient,
  USDC_ADDRESS,
} from "@stealthgiving/definition";
import {
  createPublicClient,
  decodeAbiParameters,
  erc20Abi,
  getAddress,
  Hex,
  hexToString,
  http,
} from "viem";
import { FUELME_ADDRESSES } from "@stealthgiving/contracts";
import { StealthAddress, Transaction } from "../stores/useUserStore";
import { mainnet } from "viem/chains";

const BLOCK_BATCH_SIZE = 1000n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

self.onmessage = async (ev: MessageEvent) => {
  let fromBlock = BigInt(ev.data.payload.syncToBlock || 0);
  const viewingPrivateKey: Hex = ev.data.payload.viewingPrivateKey as Hex;
  const spendingPublicKey: Hex = ev.data.payload.spendingPublicKey as Hex;
  try {
    while (true) {
      const latestBlock = await publicClient.getBlockNumber();
      let toBlock: bigint = latestBlock;
      const newStealthAddresses: StealthAddress[] = [];
      const newTransactions: Transaction[] = [];
      if (fromBlock <= latestBlock) {
        toBlock =
          latestBlock > fromBlock + BLOCK_BATCH_SIZE
            ? fromBlock + BLOCK_BATCH_SIZE
            : latestBlock;

        const logs = await publicClient.getLogs({
          fromBlock: fromBlock,
          toBlock: toBlock,
          address: ANNOUNCER_ADDRESS,
          event: ANNOUNCER_EVENT,
        });

        for (const log of logs) {
          const { caller, ephemeralPubKey, metadata, stealthAddress } =
            log.args;
          if (
            !metadata ||
            metadata === "0x" ||
            !stealthAddress ||
            !ephemeralPubKey ||
            !caller ||
            getAddress(caller) != getAddress(FUELME_ADDRESSES[CHAIN.id])
          )
            continue;
          const parsedMetadata = decodeAbiParameters(
            [
              { name: "viewTag", type: "bytes1" },
              { name: "message", type: "bytes" },
            ],
            metadata
          );

          const isOwnerOfStealthAddress = checkStealthAddress(
            stealthAddress,
            ephemeralPubKey,
            spendingPublicKey,
            viewingPrivateKey,
            parsedMetadata[0]
          );

          if (isOwnerOfStealthAddress) {
            let message = "Cannot decrypt message";
            try {
              const ethEncryptedData = hexToString(parsedMetadata[1]);
              const [nonce, ephemPublicKey, ciphertext] =
                ethEncryptedData.split("|");
              message = decryptSymmetric(
                {
                  nonce: nonce as Hex,
                  ephemPublicKey: ephemPublicKey as Hex,
                  ciphertext: ciphertext as Hex,
                },
                viewingPrivateKey.slice(2)
              );
            } catch (e) {
              console.error("Decrypt message error", e);
            }
            const transaction = await publicClient.getTransaction({
              hash: log.transactionHash,
            });
            const balance = await publicClient.readContract({
              address: USDC_ADDRESS,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [stealthAddress],
            });
            const ens = await ethClient.getEnsName({
              address: "0x4FFF0f708c768a46050f9b96c46C265729D1a62f",
            });
            const ensAvatar = ens
              ? await ethClient.getEnsAvatar({
                  name: ens,
                })
              : null;
            newStealthAddresses.push({
              address: stealthAddress,
              ephemeralPublicKey: ephemeralPubKey,
            });

            newTransactions.push({
              blockTimestamp: (
                await publicClient.getBlock({ blockNumber: log.blockNumber })
              ).timestamp.toString(),
              blockNumber: log.blockNumber.toString(),
              txHash: log.transactionHash,
              from: transaction.from,
              message,
              amount: balance.toString(),
              supporterName: ens || undefined,
              avatarUrl: ensAvatar || undefined,
            });
          }
        }
      }
      self.postMessage({
        type: "NEW_BATCH",
        payload: {
          fromBlock,
          toBlock,
          latestBlock,
          newStealthAddresses,
          newTransactions,
        },
      });

      fromBlock = toBlock + 1n;
      await sleep(2000);
    }
  } catch (e) {
    console.error("Indexer worker error", e);
    self.postMessage({
      type: "ERROR",
      payload: { message: (e as Error).message },
    });
  }
};
