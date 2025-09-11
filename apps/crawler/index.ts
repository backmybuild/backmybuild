import { createPublicClient, http, parseAbiItem, type Transaction } from "viem";
import { baseSepolia } from "viem/chains";
import prisma from "@fuelme/database"

const BLOCK_BATCH_SIZE = 20n;

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const processTransactions = async (txs: Transaction[]) => {
  console.log(`Processing ${txs.length} transactions...`);
};

const processEvents = async (events: any[]) => {
  console.log(`Processing ${events.length} events...`);
};

const processRange = async (fromBlock: bigint, blockNumber: bigint) => {
  console.log(`Processing blocks from ${fromBlock} to ${blockNumber}...`);
  const transactions: Transaction[] = [];
  for (let i = fromBlock + 1n; i <= blockNumber; i++) {
    const block = await client.getBlock({
      blockNumber: i,
      includeTransactions: true,
    });
    transactions.push(...(block.transactions as Transaction[]));
  }

  const events = await client.getLogs({
    fromBlock: fromBlock,
    toBlock: blockNumber,
    event: parseAbiItem("event Transfer(address,address,uint256)"),
  });

  await processTransactions(transactions);
  await processEvents(events);
};

const main = async () => {
  console.log("Starting crawler...");
  const user = await prisma.user.findFirst();

  console.log("Found user:", user);
  // let startBlock = await client.getBlockNumber();
  // while (true) {
  //   try {
  //     const currentBlock = await client.getBlockNumber();
  //     if (currentBlock > startBlock) {
  //       const targetBlock =
  //         currentBlock > startBlock + BLOCK_BATCH_SIZE
  //           ? startBlock + BLOCK_BATCH_SIZE
  //           : currentBlock;
  //       await processRange(startBlock + 1n, targetBlock);
  //       startBlock = targetBlock;
  //     }
  //     await sleep(2000); // Wait for 2 seconds before the next fetch
  //   } catch (e) {
  //     console.error(e);
  //     await sleep(2000);
  //   }
  // }
};

main();
