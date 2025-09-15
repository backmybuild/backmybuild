/// <reference lib="webworker" />
import { checkStealthAddress } from "@stealthgiving/stealth";
import { CHAIN, publicClient } from "@stealthgiving/defination";
import { FUELME_ADDRESSES } from "@stealthgiving/contracts";
import { parseAbiItem } from "viem";

const BLOCK_BATCH_SIZE = 1000n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

self.onmessage = async (ev: MessageEvent) => {
  let fromBlock = BigInt(ev.data.payload.syncToBlock || 0);
  try {
    while (true) {
      const latestBlock = await publicClient.getBlockNumber();
      const newStealthAddresses = [];
      const newTransactions = [];
      if (fromBlock <= latestBlock) {
        const toBlock =
          latestBlock > fromBlock + BLOCK_BATCH_SIZE
            ? fromBlock + BLOCK_BATCH_SIZE
            : latestBlock;

        const logs = await publicClient.getLogs({
          fromBlock: fromBlock,
          toBlock: toBlock,
          address: FUELME_ADDRESSES[CHAIN.id],
          event: parseAbiItem(
            "event Announcement(address indexed stealthAddress,uint16 indexed viewTag,bytes ephemeralPublicKey,uint256 amount,bytes message)"
          ),
        });

        console.log(`Processing blocks ${fromBlock} to ${toBlock}, found ${logs.length} logs`);
      }
      await sleep(5000);
    }
  } catch (e) {
    self.postMessage({ type: "ERROR", error: JSON.stringify(e) });
  }
};
